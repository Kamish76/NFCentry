import { NextResponse } from 'next/server'
import { MembershipService } from '@/lib/services/membership.service'
import { withAuth } from '@/lib/api-auth-middleware'

/**
 * GET /api/membership/user/[userId]/tags
 * Get user's membership tags (OrganizationName:Role format)
 */
export const GET = withAuth(
  async (
    { user },
    { params }: { params: Promise<{ userId: string }> }
  ) => {
  try {
    const { userId: targetUserId } = await params

    // Users can only view their own tags
    if (targetUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only view your own membership tags' },
        { status: 403 }
      )
    }

    const tags = await MembershipService.getUserMembershipTags(targetUserId)

    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error('Error fetching membership tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
)
