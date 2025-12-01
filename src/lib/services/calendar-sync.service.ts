import { google, calendar_v3 } from 'googleapis';
import { createServiceRoleClient } from '@/lib/server';
import { encryptToken, decryptToken } from '@/lib/encryption';
import { Event } from '@/types/event';

/**
 * Calendar Sync Service
 * Handles synchronization of organization events to members' Google Calendars.
 * Processes members in batches of 10 to avoid rate limiting.
 */

// Types for calendar sync
export interface CalendarSyncRecord {
  id: string;
  membership_id: string;
  user_id: string;
  google_refresh_token_encrypted: string | null;
  google_access_token_encrypted: string | null;
  token_expires_at: string | null;
  sync_status: 'active' | 'failed' | 'disconnected';
  last_error: string | null;
}

export interface EventCalendarMapping {
  id: string;
  event_id: string;
  member_calendar_sync_id: string;
  google_calendar_event_id: string;
}

// Configuration
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Get Google OAuth2 client with credentials
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google OAuth URL for calendar access
 */
export function getGoogleAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent', // Force consent to get refresh token
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }

  const expiresAt = tokens.expiry_date 
    ? new Date(tokens.expiry_date) 
    : new Date(Date.now() + 3600 * 1000);

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  };
}

/**
 * Refresh access token if needed
 */
async function refreshTokenIfNeeded(
  syncRecord: CalendarSyncRecord
): Promise<{ accessToken: string; needsUpdate: boolean; newExpiresAt?: Date }> {
  if (!syncRecord.google_access_token_encrypted || !syncRecord.google_refresh_token_encrypted) {
    throw new Error('Missing tokens for sync record');
  }

  const tokenExpiresAt = syncRecord.token_expires_at 
    ? new Date(syncRecord.token_expires_at) 
    : new Date(0);
  
  // Check if token is still valid (with buffer)
  if (tokenExpiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return {
      accessToken: decryptToken(syncRecord.google_access_token_encrypted),
      needsUpdate: false,
    };
  }

  // Token needs refresh
  const oauth2Client = getOAuth2Client();
  const refreshToken = decryptToken(syncRecord.google_refresh_token_encrypted);
  
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  const newExpiresAt = credentials.expiry_date 
    ? new Date(credentials.expiry_date) 
    : new Date(Date.now() + 3600 * 1000);

  return {
    accessToken: credentials.access_token,
    needsUpdate: true,
    newExpiresAt,
  };
}

/**
 * Get Google Calendar client with valid access token
 */
async function getCalendarClient(
  syncRecord: CalendarSyncRecord
): Promise<{ calendar: calendar_v3.Calendar; tokenUpdate?: { accessToken: string; expiresAt: Date } }> {
  const { accessToken, needsUpdate, newExpiresAt } = await refreshTokenIfNeeded(syncRecord);
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  if (needsUpdate && newExpiresAt) {
    return {
      calendar,
      tokenUpdate: { accessToken, expiresAt: newExpiresAt },
    };
  }
  
  return { calendar };
}

/**
 * Convert event to Google Calendar event format
 */
function eventToGoogleCalendarEvent(event: Event, orgName?: string): calendar_v3.Schema$Event {
  const eventDate = new Date(event.date);
  const eventStart = event.event_start ? new Date(event.event_start) : eventDate;
  const eventEnd = event.event_end ? new Date(event.event_end) : new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour

  const description = [
    event.description,
    orgName ? `\n\nOrganization: ${orgName}` : '',
    '\n\n---\nSynced from NFC Attendance System',
  ].filter(Boolean).join('');

  return {
    summary: event.event_name,
    description,
    location: event.location || undefined,
    start: {
      dateTime: eventStart.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: eventEnd.toISOString(),
      timeZone: 'UTC',
    },
    source: {
      title: 'NFC Attendance System',
      url: process.env.NEXT_PUBLIC_APP_URL || undefined,
    },
  };
}

/**
 * Create a calendar event for a single member
 */
async function createCalendarEventForMember(
  syncRecord: CalendarSyncRecord,
  event: Event,
  orgName?: string
): Promise<{ success: boolean; googleEventId?: string; error?: string }> {
  try {
    const { calendar, tokenUpdate } = await getCalendarClient(syncRecord);
    const supabase = createServiceRoleClient();

    // Update token if refreshed
    if (tokenUpdate) {
      await supabase
        .from('member_calendar_sync')
        .update({
          google_access_token_encrypted: encryptToken(tokenUpdate.accessToken),
          token_expires_at: tokenUpdate.expiresAt.toISOString(),
        })
        .eq('id', syncRecord.id);
    }

    const googleEvent = eventToGoogleCalendarEvent(event, orgName);
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    if (!response.data.id) {
      throw new Error('No event ID returned from Google');
    }

    // Store mapping
    await supabase.from('event_calendar_mapping').insert({
      event_id: event.id,
      member_calendar_sync_id: syncRecord.id,
      google_calendar_event_id: response.data.id,
    });

    // Update last sync time
    await supabase
      .from('member_calendar_sync')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', syncRecord.id);

    return { success: true, googleEventId: response.data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Mark sync as failed
    const supabase = createServiceRoleClient();
    await supabase
      .from('member_calendar_sync')
      .update({
        sync_status: 'failed',
        last_error: errorMessage,
      })
      .eq('id', syncRecord.id);

    return { success: false, error: errorMessage };
  }
}

/**
 * Update a calendar event for a single member
 */
async function updateCalendarEventForMember(
  syncRecord: CalendarSyncRecord,
  event: Event,
  googleEventId: string,
  orgName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { calendar, tokenUpdate } = await getCalendarClient(syncRecord);
    const supabase = createServiceRoleClient();

    // Update token if refreshed
    if (tokenUpdate) {
      await supabase
        .from('member_calendar_sync')
        .update({
          google_access_token_encrypted: encryptToken(tokenUpdate.accessToken),
          token_expires_at: tokenUpdate.expiresAt.toISOString(),
        })
        .eq('id', syncRecord.id);
    }

    const googleEvent = eventToGoogleCalendarEvent(event, orgName);
    
    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: googleEvent,
    });

    // Update last sync time
    await supabase
      .from('member_calendar_sync')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', syncRecord.id);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Mark sync as failed
    const supabase = createServiceRoleClient();
    await supabase
      .from('member_calendar_sync')
      .update({
        sync_status: 'failed',
        last_error: errorMessage,
      })
      .eq('id', syncRecord.id);

    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a calendar event for a single member
 */
async function deleteCalendarEventForMember(
  syncRecord: CalendarSyncRecord,
  googleEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { calendar, tokenUpdate } = await getCalendarClient(syncRecord);
    const supabase = createServiceRoleClient();

    // Update token if refreshed
    if (tokenUpdate) {
      await supabase
        .from('member_calendar_sync')
        .update({
          google_access_token_encrypted: encryptToken(tokenUpdate.accessToken),
          token_expires_at: tokenUpdate.expiresAt.toISOString(),
        })
        .eq('id', syncRecord.id);
    }

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    // Remove mapping
    await supabase
      .from('event_calendar_mapping')
      .delete()
      .eq('member_calendar_sync_id', syncRecord.id)
      .eq('google_calendar_event_id', googleEventId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't mark as failed for delete errors (event might already be deleted)
    console.error(`Failed to delete calendar event: ${errorMessage}`);

    return { success: false, error: errorMessage };
  }
}

/**
 * Process items in batches with delay
 */
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches (except after the last batch)
    if (i + BATCH_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Get active calendar syncs for an organization
 */
async function getActiveSyncsForOrg(orgId: string): Promise<CalendarSyncRecord[]> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from('member_calendar_sync')
    .select(`
      id,
      membership_id,
      google_refresh_token_encrypted,
      google_access_token_encrypted,
      token_expires_at,
      sync_status,
      last_error,
      organization_members!inner (
        user_id,
        organization_id
      )
    `)
    .eq('sync_status', 'active')
    .eq('organization_members.organization_id', orgId);

  if (error) {
    console.error('Error fetching active syncs:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((record: any) => ({
    id: record.id,
    membership_id: record.membership_id,
    user_id: record.organization_members.user_id,
    google_refresh_token_encrypted: record.google_refresh_token_encrypted,
    google_access_token_encrypted: record.google_access_token_encrypted,
    token_expires_at: record.token_expires_at,
    sync_status: record.sync_status,
    last_error: record.last_error,
  }));
}

/**
 * Get organization name
 */
async function getOrganizationName(orgId: string): Promise<string | undefined> {
  const supabase = createServiceRoleClient();
  
  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  return data?.name;
}

/**
 * Sync a new event to all active members of an organization
 */
export async function syncEventToOrgMembers(
  event: Event,
  orgId: string
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const activeSyncs = await getActiveSyncsForOrg(orgId);
  
  if (activeSyncs.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  const orgName = await getOrganizationName(orgId);
  
  const results = await processBatch(activeSyncs, async (syncRecord) => {
    return createCalendarEventForMember(syncRecord, event, orgName);
  });

  const synced = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results.filter(r => r.error).map(r => r.error!);

  console.log(`Calendar sync for event ${event.id}: ${synced} synced, ${failed} failed`);

  return { synced, failed, errors };
}

/**
 * Update an event for all active members of an organization
 */
export async function updateEventForOrgMembers(
  event: Event,
  orgId: string
): Promise<{ updated: number; failed: number; errors: string[] }> {
  const supabase = createServiceRoleClient();
  const activeSyncs = await getActiveSyncsForOrg(orgId);
  
  if (activeSyncs.length === 0) {
    return { updated: 0, failed: 0, errors: [] };
  }

  const orgName = await getOrganizationName(orgId);

  // Get existing mappings for this event
  const { data: mappings } = await supabase
    .from('event_calendar_mapping')
    .select('member_calendar_sync_id, google_calendar_event_id')
    .eq('event_id', event.id);

  const mappingMap = new Map(
    (mappings || []).map(m => [m.member_calendar_sync_id, m.google_calendar_event_id])
  );

  const results = await processBatch(activeSyncs, async (syncRecord) => {
    const googleEventId = mappingMap.get(syncRecord.id);
    
    if (googleEventId) {
      // Update existing
      return updateCalendarEventForMember(syncRecord, event, googleEventId, orgName);
    } else {
      // Create new (member might have enabled sync after event was created)
      return createCalendarEventForMember(syncRecord, event, orgName);
    }
  });

  const updated = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results.filter(r => r.error).map(r => r.error!);

  console.log(`Calendar update for event ${event.id}: ${updated} updated, ${failed} failed`);

  return { updated, failed, errors };
}

/**
 * Delete an event for all synced members of an organization
 */
export async function deleteEventForOrgMembers(
  eventId: string,
  orgId: string
): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const supabase = createServiceRoleClient();
  
  // Get all mappings for this event with sync records
  const { data: mappings } = await supabase
    .from('event_calendar_mapping')
    .select(`
      id,
      google_calendar_event_id,
      member_calendar_sync_id,
      member_calendar_sync (
        id,
        membership_id,
        google_refresh_token_encrypted,
        google_access_token_encrypted,
        token_expires_at,
        sync_status,
        last_error,
        organization_members!inner (
          user_id,
          organization_id
        )
      )
    `)
    .eq('event_id', eventId);

  if (!mappings || mappings.length === 0) {
    return { deleted: 0, failed: 0, errors: [] };
  }

  const results = await processBatch(mappings, async (mapping) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncData = mapping.member_calendar_sync as any;
    
    if (!syncData || syncData.sync_status !== 'active') {
      // Just delete the mapping if sync is not active
      await supabase
        .from('event_calendar_mapping')
        .delete()
        .eq('id', mapping.id);
      return { success: true };
    }

    const syncRecord: CalendarSyncRecord = {
      id: syncData.id,
      membership_id: syncData.membership_id,
      user_id: syncData.organization_members.user_id,
      google_refresh_token_encrypted: syncData.google_refresh_token_encrypted,
      google_access_token_encrypted: syncData.google_access_token_encrypted,
      token_expires_at: syncData.token_expires_at,
      sync_status: syncData.sync_status,
      last_error: syncData.last_error,
    };

    return deleteCalendarEventForMember(syncRecord, mapping.google_calendar_event_id);
  });

  const deleted = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results.filter(r => r.error).map(r => r.error!);

  console.log(`Calendar delete for event ${eventId}: ${deleted} deleted, ${failed} failed`);

  return { deleted, failed, errors };
}

/**
 * Revoke Google Calendar access for a sync record
 */
export async function revokeCalendarAccess(syncId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  
  try {
    // Get the sync record
    const { data: syncRecord, error: fetchError } = await supabase
      .from('member_calendar_sync')
      .select('*')
      .eq('id', syncId)
      .single();

    if (fetchError || !syncRecord) {
      throw new Error('Sync record not found');
    }

    // Try to revoke the token with Google (optional, may fail)
    if (syncRecord.google_access_token_encrypted) {
      try {
        const oauth2Client = getOAuth2Client();
        const accessToken = decryptToken(syncRecord.google_access_token_encrypted);
        await oauth2Client.revokeToken(accessToken);
      } catch (revokeError) {
        // Log but don't fail - token might already be invalid
        console.warn('Failed to revoke Google token:', revokeError);
      }
    }

    // Update sync record to disconnected
    await supabase
      .from('member_calendar_sync')
      .update({
        sync_status: 'disconnected',
        google_access_token_encrypted: null,
        google_refresh_token_encrypted: null,
        token_expires_at: null,
        last_error: null,
      })
      .eq('id', syncId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get calendar sync status for a membership
 */
export async function getCalendarSyncStatus(membershipId: string): Promise<{
  enabled: boolean;
  status: 'active' | 'failed' | 'disconnected' | null;
  lastSyncAt: string | null;
  lastError: string | null;
} | null> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from('member_calendar_sync')
    .select('sync_status, last_sync_at, last_error')
    .eq('membership_id', membershipId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    enabled: data.sync_status !== 'disconnected',
    status: data.sync_status,
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
  };
}
