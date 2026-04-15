import { NextResponse } from 'next/server'
import { MembershipService } from '@/lib/services/membership.service'
import { withAuth } from '@/lib/api-auth-middleware'

/**
 * GET /api/membership/user/[userId]
 * Get all memberships for a specific user
 */
export const GET = withAuth(
  async (
    { user },
    { params }: { params: Promise<{ userId: string }> }
  ) => {
  try {
    const { userId: targetUserId } = await params

    // Users can only view their own memberships unless they're an admin
    if (targetUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only view your own memberships' },
        { status: 403 }
      )
    }

    const memberships = await MembershipService.getUserMemberships(
      targetUserId
    )

    return NextResponse.json({ memberships }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
)
