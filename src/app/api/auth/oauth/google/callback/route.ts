import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'
import { sanitizeNext, OAUTH_STATE_COOKIE_NAME } from '@/lib/auth/oauth'

function failRedirect(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam || !code || !state) {
      if (errorParam) {
        console.error('[Google OAuth Callback] Error returned from provider:', errorParam)
      }
      return failRedirect(request)
    }

    // 1. Verify state against the cookie
    const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value
    let savedState: string | null = null
    let savedNext: string | null = null

    if (stateCookie) {
      try {
        const parsed = JSON.parse(stateCookie)
        savedState = parsed.state
        savedNext = parsed.next
      } catch {
        // Invalid state cookie JSON
      }
    }

    if (!savedState || savedState !== state) {
      console.error('[Google OAuth Callback] State mismatch or missing cookie')
      return failRedirect(request)
    }

    const safeNext = sanitizeNext(savedNext)

    // 2. Exchange code for access token
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!googleClientId || !googleClientSecret) {
      console.error('[Google OAuth Callback] Missing Google client credentials')
      return failRedirect(request)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('[Google OAuth Callback] Token exchange failed:', await tokenResponse.text())
      return failRedirect(request)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('[Google OAuth Callback] No access token in response')
      return failRedirect(request)
    }

    // 3. Retrieve user profile info from Google
    const userinfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      console.error('[Google OAuth Callback] Userinfo request failed:', await userinfoResponse.text())
      return failRedirect(request)
    }

    const userInfo = await userinfoResponse.json()

    if (!userInfo.email || userInfo.email_verified !== true) {
      console.error('[Google OAuth Callback] Email missing or unverified:', userInfo?.email)
      return failRedirect(request)
    }

    const cleanEmail = userInfo.email.trim().toLowerCase()
    const name = userInfo.name || 'Google User'

    // 4. Find or create user in auth.users
    const userRes = await query(
      `SELECT id, email, raw_user_meta_data FROM auth.users WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    )

    let userId: string

    if (userRes.rowCount === 0) {
      const insertRes = await query(
        `INSERT INTO auth.users (email, raw_user_meta_data)
         VALUES ($1, $2::jsonb)
         RETURNING id`,
        [cleanEmail, JSON.stringify({ name, provider: 'google' })]
      )
      userId = insertRes.rows[0].id
    } else {
      userId = userRes.rows[0].id
      // Preserves existing password_hash and metadata
    }

    // Ensure public.users row exists
    const publicRes = await query(`SELECT id FROM public.users WHERE id = $1 LIMIT 1`, [userId])
    if (publicRes.rowCount === 0) {
      await query(
        `INSERT INTO public.users (id, name, email, user_type, auth_provider, has_password)
         VALUES ($1, $2, $3, 'Student', 'google', false)
         ON CONFLICT (id) DO NOTHING`,
        [userId, name, cleanEmail]
      )
    }

    // 5. Create session token and set cookie
    const token = await createSessionToken({ id: userId, email: cleanEmail })
    const response = NextResponse.redirect(new URL(safeNext, request.url))

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    // Clear state cookie
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('[Google OAuth Callback Fatal Error]', error)
    return failRedirect(request)
  }
}
