import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const next = searchParams.get('next') || '/dashboard'

  // Check if we have Google OAuth credentials configured
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (googleClientId && googleClientSecret) {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(next)}`
    return NextResponse.redirect(googleAuthUrl)
  }

  // Development convenience fallback: Create or log in a default Google dev user
  const devEmail = 'google.user@example.com'
  const devName = 'Google User'

  let userRes = await query(`SELECT id, email FROM auth.users WHERE LOWER(email) = $1 LIMIT 1`, [devEmail])
  let userId: string

  if (userRes.rowCount === 0) {
    const insertRes = await query(
      `INSERT INTO auth.users (email, raw_user_meta_data)
       VALUES ($1, $2::jsonb)
       RETURNING id`,
      [devEmail, JSON.stringify({ name: devName, provider: 'google' })]
    )
    userId = insertRes.rows[0].id
  } else {
    userId = userRes.rows[0].id
  }

  const token = await createSessionToken({ id: userId, email: devEmail })
  const response = NextResponse.redirect(new URL(next, request.url))
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return response
}
