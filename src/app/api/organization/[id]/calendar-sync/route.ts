import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/server';
import { revokeCalendarAccess, getCalendarSyncStatus } from '@/lib/services/calendar-sync.service';

/**
 * GET /api/organization/[id]/calendar-sync
 * Get calendar sync status for the current user in this organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's membership in this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Get sync status
    const syncStatus = await getCalendarSyncStatus(membership.id);

    return NextResponse.json({
      membershipId: membership.id,
      calendarSync: syncStatus || {
        enabled: false,
        status: null,
        lastSyncAt: null,
        lastError: null,
      },
    });
  } catch (error) {
    console.error('Get calendar sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar sync status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organization/[id]/calendar-sync
 * Disconnect calendar sync for the current user in this organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's membership in this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // Get sync record
    const supabaseAdmin = createServiceRoleClient();
    const { data: syncRecord, error: syncError } = await supabaseAdmin
      .from('member_calendar_sync')
      .select('id')
      .eq('membership_id', membership.id)
      .single();

    if (syncError || !syncRecord) {
      return NextResponse.json(
        { error: 'Calendar sync not enabled for this organization' },
        { status: 404 }
      );
    }

    // Revoke access
    const result = await revokeCalendarAccess(syncRecord.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to disconnect calendar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar sync disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar sync' },
      { status: 500 }
    );
  }
}
