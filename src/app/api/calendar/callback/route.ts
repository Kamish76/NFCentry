import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/server';
import { exchangeCodeForTokens } from '@/lib/services/calendar-sync.service';
import { encryptToken } from '@/lib/encryption';

/**
 * GET /api/calendar/callback
 * Handles Google OAuth callback after user authorizes calendar access.
 * Stores encrypted tokens and sets up sync for the membership.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Default redirect on error
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const errorRedirect = `${baseUrl}/organizations?calendar_error=true`;

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${errorRedirect}&message=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${errorRedirect}&message=missing_parameters`);
  }

  try {
    // Decode state
    let stateData: { membershipId: string; redirect: string; userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${errorRedirect}&message=invalid_state`);
    }

    const { membershipId, redirect, userId } = stateData;

    // Verify user is still authenticated with the same ID
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(`${errorRedirect}&message=session_expired`);
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(code);

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);

    // Use service role client to upsert sync record
    const supabaseAdmin = createServiceRoleClient();

    // Check if sync record already exists
    const { data: existingSync } = await supabaseAdmin
      .from('member_calendar_sync')
      .select('id')
      .eq('membership_id', membershipId)
      .single();

    if (existingSync) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('member_calendar_sync')
        .update({
          google_access_token_encrypted: encryptedAccessToken,
          google_refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          sync_status: 'active',
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSync.id);

      if (updateError) {
        console.error('Failed to update sync record:', updateError);
        return NextResponse.redirect(`${errorRedirect}&message=database_error`);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from('member_calendar_sync')
        .insert({
          membership_id: membershipId,
          google_access_token_encrypted: encryptedAccessToken,
          google_refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          sync_status: 'active',
        });

      if (insertError) {
        console.error('Failed to create sync record:', insertError);
        return NextResponse.redirect(`${errorRedirect}&message=database_error`);
      }
    }

    // Get organization ID for redirect
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('id', membershipId)
      .single();

    const successRedirect = membership
      ? `${baseUrl}/organizations/${membership.organization_id}/settings?calendar_connected=true`
      : `${baseUrl}${redirect}?calendar_connected=true`;

    return NextResponse.redirect(successRedirect);
  } catch (error) {
    console.error('Calendar callback error:', error);
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.redirect(`${errorRedirect}&message=${encodeURIComponent(message)}`);
  }
}
