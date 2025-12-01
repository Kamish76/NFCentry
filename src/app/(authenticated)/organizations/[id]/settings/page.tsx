import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import { OrganizationService } from '@/lib/services/organization.service';
import { UserService } from '@/lib/services/user.service';
import { CalendarSyncSettings } from '@/components/organizations/calendar-sync-settings';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrganizationSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationSettingsPage({
  params,
}: OrganizationSettingsPageProps) {
  const { id: organizationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify user profile exists
  const userProfile = await UserService.getUserById(user.id);

  if (!userProfile) {
    redirect('/complete-profile');
  }

  // Fetch organization details
  const organization = await OrganizationService.getOrganizationById(
    organizationId
  );

  if (!organization) {
    notFound();
  }

  // Verify user is a member of this organization
  const membership = await OrganizationService.getMember(
    organizationId,
    user.id
  );

  if (!membership) {
    redirect('/organizations');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/organizations`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <p className="text-muted-foreground">Organization Settings</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Calendar Sync Section */}
          <CalendarSyncSettings
            organizationId={organizationId}
            organizationName={organization.name}
          />

          {/* Future settings sections can be added here */}
          {/* Example:
          <NotificationSettings organizationId={organizationId} />
          <PrivacySettings organizationId={organizationId} />
          */}
        </div>
      </div>
    </div>
  );
}
