import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { MembershipService } from '@/lib/services/membership.service'
import { OrganizationService } from '@/lib/services/organization.service'
import { MembersView } from '@/components/organizations/members-view'
import type { MembershipRole } from '@/types/membership'

interface MembersPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id: organizationId } = await params

  // Check if user is a member of the organization
  const userMembership = await MembershipService.getUserMembershipInOrganization(
    user.id,
    organizationId
  )

  if (!userMembership) {
    redirect('/organizations')
  }

  // Get organization details
  const organization = await OrganizationService.getOrganizationById(organizationId)

  if (!organization) {
    redirect('/organizations')
  }

  // Initial paginated load (first 20) and total count
  const [members, total] = await Promise.all([
    MembershipService.getOrganizationMembersPaged(organizationId, { limit: 20, offset: 0 }),
    MembershipService.countMemberships({ organization_id: organizationId }),
  ])

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
      <MembersView 
        organization={organization} 
        initialMembers={members}
        total={total}
        pageSize={20}
        organizationId={organizationId}
        currentUserRole={userMembership.role as MembershipRole}
        currentUserId={user.id}
      />
    </div>
  )
}
