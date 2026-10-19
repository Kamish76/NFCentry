import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth-middleware'
import { UserService } from '@/lib/services/user.service'

/**
 * POST /api/user/mark-password-set
 * Mark that the current user has set a password
 * Used when OAuth users set their first password
 */
export const POST = withAuth(async ({ user: authUser }) => {
  try {
    // Mark password as set
    const { success, error } = await UserService.markPasswordSet(authUser.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error marking password as set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
