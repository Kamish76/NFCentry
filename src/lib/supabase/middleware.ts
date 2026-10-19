import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that do not require authentication
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

// Auth routes that should redirect to authenticated dashboard if already logged in
const authRoutes = [
  '/login',
  '/sign-up',
]

const profileCompletionRoute = '/complete-profile'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      // Don't crash if env variables are missing during static analysis/build
      return supabaseResponse
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Securely get the user from Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // For API routes, session cookies are refreshed above. Do not redirect API calls with HTML pages.
    // API route handlers handle their own auth enforcement (e.g. 401 JSON via withAuth)
    // and profile submission at /api/user/complete-profile must not be intercepted.
    if (pathname.startsWith('/api/')) {
      return supabaseResponse
    }

    // Precise public route matching (Fixes Defect #1 pathname.startsWith('/') bug)
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

    // 3. If user is authenticated, check if profile is completed
    if (user && !isPublicRoute && !isProfileCompletionRoute) {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', user.id)
          .maybeSingle()

        if (!userProfile || !userProfile.name) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = profileCompletionRoute
          return NextResponse.redirect(redirectUrl)
        }
      } catch (profileError) {
        console.error('[MIDDLEWARE] Profile check error:', profileError)
      }
    }
  } catch (err) {
    console.error('[MIDDLEWARE] Unexpected session update error:', err)
  }

  return supabaseResponse
}
