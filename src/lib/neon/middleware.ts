import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/token'

const publicRoutes = [
  '/',
  '/login',
  '/sign-up',
  '/sign-up-success',
  '/forgot-password',
  '/update-password',
  '/confirm',
  '/error',
]

const authRoutes = [
  '/login',
  '/sign-up',
]

const profileCompletionRoute = '/complete-profile'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  try {
    const pathname = request.nextUrl.pathname

    // For API routes, let route handlers handle their own auth
    if (pathname.startsWith('/api/')) {
      return response
    }

    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const user = cookieToken ? await verifySessionToken(cookieToken) : null

    const isPublicRoute = publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/'
      }
      return pathname === route || pathname.startsWith(`${route}/`)
    })

    const isAuthRoute = authRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
    const isProfileCompletionRoute = pathname === profileCompletionRoute

    // 1. If user is logged in and visits login/signup, redirect to /dashboard
    if (user && isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    // 2. If user is not authenticated and attempts to access protected routes, redirect to /login
    if (!user && !isPublicRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (err) {
    console.error('[Neon Middleware] Unexpected session update error:', err)
  }

  return response
}
