import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Fetch user from auth.users and public.users
    const authRes = await query(
      `SELECT a.id, a.email, a.raw_user_meta_data, p.name, p.user_type
       FROM auth.users a
       LEFT JOIN public.users p ON p.id = a.id
       WHERE LOWER(a.email) = $1
       LIMIT 1`,
      [cleanEmail]
    )

    if (authRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const authUser = authRes.rows[0]
    const storedHash = authUser.raw_user_meta_data?.password_hash

    // Verify password if hash exists
    if (storedHash) {
      const isValid = verifyPassword(password, storedHash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    // 2. Create signed session token
    const sessionToken = await createSessionToken({
      id: authUser.id,
      email: authUser.email,
    })

    const response = NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || null,
        user_type: authUser.user_type || null,
      },
      session: {
        access_token: sessionToken,
      },
    })

    // Set HTTP-only secure cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('[Neon Auth Login Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
