import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, user_type = 'Student' } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Check if user already exists
    const existing = await query(
      `SELECT id FROM auth.users WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    )

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: 'User already registered with this email' },
        { status: 400 }
      )
    }

    // 2. Hash password and insert into auth.users
    const pHash = hashPassword(password)
    const authInsert = await query(
      `INSERT INTO auth.users (email, raw_user_meta_data)
       VALUES ($1, $2::jsonb)
       RETURNING id, email`,
      [cleanEmail, JSON.stringify({ password_hash: pHash, name })]
    )

    const newUser = authInsert.rows[0]

    // 3. Create session token
    const sessionToken = await createSessionToken({
      id: newUser.id,
      email: newUser.email,
    })

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: name || null,
        user_type,
      },
      session: {
        access_token: sessionToken,
      },
    })

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('[Neon Auth SignUp Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
