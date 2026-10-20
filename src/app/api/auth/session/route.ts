import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null

    const token = cookieToken || bearerToken
    if (!token) {
      return NextResponse.json({ user: null, session: null }, { status: 200 })
    }

    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ user: null, session: null }, { status: 200 })
    }

    // Query user profile from public.users
    const userRes = await query(
      `SELECT id, name, email, user_type, tag_id, nfc_tag_id, qr_code_data, auth_provider, has_password, created_at, updated_at
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [payload.id]
    )

    const profile = userRes.rows[0] || null

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        name: profile?.name || null,
        user_type: profile?.user_type || null,
        profile,
      },
      session: {
        access_token: token,
        user: {
          id: payload.id,
          email: payload.email,
        },
      },
    })
  } catch (error) {
    console.error('[Neon Auth Session Error]', error)
    return NextResponse.json({ user: null, session: null }, { status: 200 })
  }
}
