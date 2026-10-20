import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifySessionToken, hashPassword, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const newHash = hashPassword(password)

    // Update raw_user_meta_data in auth.users
    await query(
      `UPDATE auth.users
       SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('password_hash', $1::text)
       WHERE id = $2`,
      [newHash, payload.id]
    )

    // Update has_password flag in public.users
    await query(
      `UPDATE public.users
       SET has_password = TRUE
       WHERE id = $1`,
      [payload.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Neon Auth Update Password Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
