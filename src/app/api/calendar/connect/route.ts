import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { getGoogleAuthUrl } from '@/lib/services/calendar-sync.service';

/**
 * GET /api/calendar/connect
 * Initiates Google OAuth flow for calendar sync.
 * Query params:
 * - membership_id: The organization membership ID to link calendar sync to
 * - redirect: Where to redirect after OAuth completes (defaults to organization settings)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('membership_id');
    const redirect = searchParams.get('redirect') || '/organizations';

    if (!membershipId) {
      return NextResponse.json(
        { error: 'Missing membership_id parameter' },
        { status: 400 }
      );
    }

    // Verify user is authenticated and owns this membership
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify membership belongs to user
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, organization_id')
      .eq('id', membershipId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Invalid membership' },
        { status: 403 }
      );
    }

    // Create state with membership ID and redirect URL
    const state = Buffer.from(JSON.stringify({
      membershipId,
      redirect,
      userId: user.id,
    })).toString('base64url');

    // Generate OAuth URL and redirect
    const authUrl = getGoogleAuthUrl(state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Calendar connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate calendar connection' },
      { status: 500 }
    );
  }
}
