import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'
import {
  sanitizeNext,
  OAUTH_STATE_COOKIE_NAME,
  getOAuthRedirectUri,
  verifySignedOAuthState,
} from '@/lib/auth/oauth'

function failRedirect(request: NextRequest, reason?: string): NextResponse {
  const url = new URL('/login?error=oauth_failed', request.url)
  if (reason) {
    url.searchParams.set('reason', reason)
  }
  const response = NextResponse.redirect(url)
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

    if (errorParam) {
      console.error('[Google OAuth Callback] Error returned from provider:', errorParam)
      return failRedirect(request, `Provider error: ${errorParam}`)
    }

    if (!code || !state) {
      console.error('[Google OAuth Callback] Missing code or state param')
      return failRedirect(request, 'Missing authorization code or state from provider')
    }

    // 1. Verify state against cookie or signed token payload
    const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value
    let savedStateId: string | null = null
    let savedNext: string | null = null

    if (stateCookie) {
      try {
        const parsed = JSON.parse(stateCookie)
        savedStateId = parsed.state
        savedNext = parsed.next
      } catch {
        // Invalid state cookie JSON
      }
    }

    const verifiedSigned = verifySignedOAuthState(state)
    const isCookieMatch =
      savedStateId &&
      (savedStateId === state || (verifiedSigned && savedStateId === verifiedSigned.rawStateId))
    const isStateValid = isCookieMatch || !!verifiedSigned

    if (!isStateValid) {
      console.error('[Google OAuth Callback] State mismatch or missing cookie', {
        hasStateCookie: !!stateCookie,
        hasVerifiedSigned: !!verifiedSigned,
      })
      return failRedirect(request, 'Session verification failed. Please try again.')
    }

    const safeNext = sanitizeNext(savedNext || verifiedSigned?.next)

    // 2. Exchange code for access token
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!googleClientId || !googleClientSecret) {
      console.error('[Google OAuth Callback] Missing Google client credentials')
      return failRedirect(request, 'Google client credentials not configured on server')
    }

    const redirectUri = getOAuthRedirectUri(request)

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
      const errText = await tokenResponse.text()
      console.error('[Google OAuth Callback] Token exchange failed:', errText)
      let detail = 'Token exchange failed'
      try {
        const errJson = JSON.parse(errText)
        if (errJson.error_description) {
          detail = `${errJson.error}: ${errJson.error_description}`
        } else if (errJson.error) {
          detail = errJson.error
        }
      } catch {
        if (errText.length < 80) detail = errText
      }
      return failRedirect(request, detail)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('[Google OAuth Callback] No access token in response')
      return failRedirect(request, 'No access token received from Google')
    }

    // 3. Retrieve user profile info from Google
    const userinfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      const errText = await userinfoResponse.text()
      console.error('[Google OAuth Callback] Userinfo request failed:', errText)
      return failRedirect(request, 'Failed to fetch user profile from Google')
    }

    const userInfo = await userinfoResponse.json()

    if (!userInfo.email || userInfo.email_verified !== true) {
      console.error('[Google OAuth Callback] Email missing or unverified:', userInfo?.email)
      return failRedirect(request, 'Google email address is missing or unverified')
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
    }

    // Ensure public.users row exists and matches
    const publicRes = await query(
      `SELECT id, email FROM public.users WHERE id = $1 OR LOWER(email) = $2 LIMIT 1`,
      [userId, cleanEmail]
    )

    if (publicRes.rowCount === 0) {
      await query(
        `INSERT INTO public.users (id, name, email, user_type, auth_provider, has_password)
         VALUES ($1, $2, $3, 'Student', 'google', false)
         ON CONFLICT (id) DO NOTHING`,
        [userId, name, cleanEmail]
      )
    } else if (publicRes.rows[0].id !== userId) {
      await query(`UPDATE public.users SET id = $1, auth_provider = 'google' WHERE LOWER(email) = $2`, [
        userId,
        cleanEmail,
      ])
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
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return failRedirect(request, `Database or server error: ${msg}`)
  }
}
