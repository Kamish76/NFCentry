import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { withAuth } from '@/lib/api-auth-middleware'

/**
 * GET /api/user/memberships
 * Get current user's organization memberships with organization details
 */
export const GET = withAuth(async ({ user: authUser }) => {
  try {
    const supabase = await createClient()

    // Fetch user's memberships with organization details
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select(`
        role,
        organizations (
          id,
          name,
          tag
        )
      `)
      .eq('user_id', authUser.id)
      .order('joined_at', { ascending: false })

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError)
      return NextResponse.json(
        { error: 'Failed to fetch memberships' },
        { status: 500 }
      )
    }

    // Transform the data to a simpler format
    const formattedMemberships = (memberships || []).map((membership: any) => ({
      role: membership.role,
      organization: membership.organizations
    }))

    return NextResponse.json({ 
      memberships: formattedMemberships,
      count: formattedMemberships.length
    })
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
