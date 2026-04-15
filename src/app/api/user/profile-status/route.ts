import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth-middleware'
import { UserService } from '@/lib/services/user.service'

/**
 * GET /api/user/profile-status
 * Check if current authenticated user has a profile
 */
export const GET = withAuth(async ({ user: authUser }) => {
  try {
    // Check if user has a profile
    const hasProfile = await UserService.hasProfile(authUser.id)

    return NextResponse.json({ 
      hasProfile,
      authId: authUser.id,
      email: authUser.email 
    })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json(
      { hasProfile: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})
