# Google Calendar Sync Setup Guide

This guide explains how to set up Google Calendar synchronization for the NFC Attendance System. When enabled, organization events are automatically synced to members' Google Calendars.

> ⚠️ **FEATURE STATUS: PENDING GOOGLE VERIFICATION**
> 
> This feature is fully implemented but requires Google OAuth app verification before it can be used in production. Until verification is complete, only manually added test users (up to 100) can use this feature.
> 
> **Why this limitation exists**: Google requires apps that access sensitive scopes (like calendar.events) to go through a verification process before allowing general public access. This protects users from malicious apps.
> 
> **To enable for testing**: Add user emails manually in Google Cloud Console → OAuth consent screen → Test users.

## Overview

- **Feature**: Automatic sync of organization events to members' Google Calendars
- **Opt-in**: Members choose which organizations to sync on a per-organization basis
- **Real-time**: Events are synced when created, updated, or deleted
- **Batch Processing**: Syncs are processed in batches of 10 to avoid rate limits
- **Status**: Implementation complete, pending Google OAuth verification

## Prerequisites

1. A Google Cloud Platform account
2. Access to create OAuth 2.0 credentials
3. The ability to set environment variables on your deployment

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "NFC Attendance Calendar Sync")
4. Click "Create"

## Step 2: Enable the Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: NFC Attendance System
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**

### Add Scopes

1. Click **Add or Remove Scopes**
2. Find and select: `https://www.googleapis.com/auth/calendar.events`
3. Click **Update**
4. Click **Save and Continue**

### Add Test Users (Development)

1. Click **Add Users**
2. Add email addresses of users who will test the feature
3. Click **Save and Continue**

> **Note**: For production, you'll need to submit your app for verification by Google.

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "NFC Attendance Web Client")

### Configure Authorized Redirect URIs

Add the following redirect URI:

**For local development:**
```
http://localhost:3000/api/calendar/callback
```

**For production:**
```
https://your-domain.com/api/calendar/callback
```

5. Click **Create**
6. Copy the **Client ID** and **Client Secret** — you'll need these for environment variables

## Step 5: Generate Encryption Secret

Generate a 32-byte (256-bit) encryption key for token encryption:

**On macOS/Linux:**
```bash
openssl rand -hex 32
```

**On Windows (PowerShell):**
```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Minimum 0 -Maximum 256) })
```

**Or using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

This will output a 64-character hexadecimal string.

## Step 6: Set Environment Variables

Add the following environment variables to your `.env.local` file (development) or deployment environment (production):

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Optional: Override redirect URI (defaults to NEXT_PUBLIC_APP_URL/api/calendar/callback)
# GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback

# Encryption secret for token storage (64 hex characters = 32 bytes)
ENCRYPTION_SECRET=your-64-character-hex-string-here

# Your app's public URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | No | Override the callback URL (defaults to `{NEXT_PUBLIC_APP_URL}/api/calendar/callback`) |
| `ENCRYPTION_SECRET` | Yes | 64-character hex string for AES-256-GCM encryption |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL of your application |

## Step 7: Run Database Migration

Apply the calendar sync migration to create the required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file
# documents/migrations/calendar_sync_migration.sql
```

This creates:
- `member_calendar_sync` - Stores encrypted OAuth tokens per organization membership
- `event_calendar_mapping` - Maps events to Google Calendar event IDs

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to an organization you're a member of

3. Click **Settings** (or **My Settings** for non-admin members)

4. In the **Google Calendar Sync** section, click **Connect Google Calendar**

5. Complete the Google OAuth flow

6. Verify the status shows "Active"

7. Create a test event in the organization

8. Check your Google Calendar — the event should appear within seconds

## Troubleshooting

### "Google OAuth credentials not configured"

Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables.

### "ENCRYPTION_SECRET must be a 64-character hex string"

Generate a new encryption secret using the command in Step 5. It must be exactly 64 hexadecimal characters.

### OAuth redirect fails with "redirect_uri_mismatch"

1. Check that your redirect URI in Google Cloud Console matches exactly
2. For local development, use `http://localhost:3000/api/calendar/callback`
3. For production, use your actual domain with HTTPS

### Sync status shows "Failed"

1. Go to organization settings
2. Check the error message displayed
3. Common causes:
   - Token expired and refresh failed (user needs to reconnect)
   - Google Calendar API quota exceeded
   - User revoked access in Google account settings

### Events not appearing in Google Calendar

1. Verify the user's sync status is "Active"
2. Check server logs for calendar sync errors
3. Ensure the Google Calendar API is enabled in your Google Cloud project

## Production Considerations

### Google OAuth Verification

For production use with external users, you must submit your app for Google OAuth verification:

1. Go to **OAuth consent screen** in Google Cloud Console
2. Click **Publish App**
3. Complete the verification process (may take several weeks)

### Rate Limiting

The system processes calendar syncs in batches of 10 members with 100ms delays to avoid hitting Google API rate limits. For organizations with many members, consider:

- Implementing a job queue for background processing
- Using Supabase Edge Functions for async sync

### Security

- OAuth tokens are encrypted using AES-256-GCM before storage
- Encryption key should be rotated periodically
- RLS policies ensure users can only access their own sync records
- Service role is used for background sync operations

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Flow                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Organization Settings ──▶ Connect Calendar ──▶ Google OAuth        │
│         │                                            │               │
│         │                                            ▼               │
│         │                                    OAuth Callback          │
│         │                                            │               │
│         │                                            ▼               │
│         │                              Store Encrypted Tokens        │
│         │                                            │               │
│         └───────────── Status: Active ◀──────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Event Sync Flow                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Admin Creates Event                                                 │
│         │                                                            │
│         ▼                                                            │
│  event.service.ts ────▶ syncEventToOrgMembers()                     │
│                                    │                                 │
│                                    ▼                                 │
│                         Get Active Syncs for Org                     │
│                                    │                                 │
│                                    ▼                                 │
│                      Process in Batches of 10                        │
│                         ┌────────┼────────┐                          │
│                         ▼        ▼        ▼                          │
│                      Member1  Member2  Member3  ...                  │
│                         │        │        │                          │
│                         ▼        ▼        ▼                          │
│                   Google Calendar API (create event)                 │
│                         │        │        │                          │
│                         ▼        ▼        ▼                          │
│                   Store mapping in event_calendar_mapping            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/encryption.ts` | AES-256-GCM token encryption |
| `src/lib/services/calendar-sync.service.ts` | Google Calendar API integration |
| `src/app/api/calendar/connect/route.ts` | Initiates OAuth flow |
| `src/app/api/calendar/callback/route.ts` | Handles OAuth callback |
| `src/app/api/organization/[id]/calendar-sync/route.ts` | Get/disconnect sync status |
| `src/components/organizations/calendar-sync-settings.tsx` | Settings UI component |
| `src/app/(authenticated)/organizations/[id]/settings/page.tsx` | Settings page |
| `documents/migrations/calendar_sync_migration.sql` | Database tables |

## Support

If you encounter issues not covered in this guide, check:

1. Server logs for detailed error messages
2. Google Cloud Console for API usage and errors
3. Supabase dashboard for database query issues

---

## Future Work / Google Verification

### To Enable This Feature for Production:

1. **Submit for Google OAuth Verification**
   - Go to Google Cloud Console → OAuth consent screen
   - Click "Publish App" (moves from Testing to Production)
   - Fill out the verification form:
     - Provide privacy policy URL
     - Explain use case for `calendar.events` scope
     - May require security assessment for sensitive scopes

2. **Expected Timeline**: 2-6 weeks for verification

3. **Requirements for Verification**:
   - Public privacy policy page
   - Clear explanation of how calendar data is used
   - Possibly a recorded demo video
   - Domain verification

### Current Limitations (Unverified App):
- Maximum 100 test users
- Users must be manually added in OAuth consent screen
- Users see "This app isn't verified" warning (can bypass by clicking Advanced)

### Database Tables Created:
- `member_calendar_sync` - Stores encrypted OAuth tokens per membership
- `event_calendar_mapping` - Maps events to Google Calendar event IDs
- These tables exist but won't be populated until the feature is enabled
