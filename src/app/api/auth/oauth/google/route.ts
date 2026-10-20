import { NextRequest, NextResponse } from 'next/server'
import {
  sanitizeNext,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  getOAuthRedirectUri,
  createSignedOAuthState,
} from '@/lib/auth/oauth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const safeNext = sanitizeNext(searchParams.get('next'))

  // Check if we have Google OAuth credentials configured
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!googleClientId || !googleClientSecret) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', request.url))
  }

  const { state, rawStateId } = createSignedOAuthState(safeNext)
  const redirectUri = getOAuthRedirectUri(request)

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    googleClientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(
    state
  )}&prompt=select_account`

  const response = NextResponse.redirect(googleAuthUrl)
  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    JSON.stringify({ state: rawStateId, next: safeNext }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    }
  )

  return response
}
