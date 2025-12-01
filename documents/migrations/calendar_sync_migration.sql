-- Calendar Sync Migration
-- Adds tables for Google Calendar sync functionality per organization membership
-- Created: 2025-12-01

-- =============================================================================
-- member_calendar_sync: Stores Google OAuth tokens per organization membership
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_calendar_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    google_refresh_token_encrypted TEXT,
    google_access_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (sync_status IN ('active', 'failed', 'disconnected')),
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_membership_calendar_sync UNIQUE (membership_id)
);

-- Index for efficient lookups by membership
CREATE INDEX IF NOT EXISTS idx_member_calendar_sync_membership_id ON member_calendar_sync(membership_id);

-- Index for finding active syncs (used when syncing events)
CREATE INDEX IF NOT EXISTS idx_member_calendar_sync_status ON member_calendar_sync(sync_status) WHERE sync_status = 'active';

-- =============================================================================
-- event_calendar_mapping: Maps events to Google Calendar event IDs per member
-- =============================================================================
CREATE TABLE IF NOT EXISTS event_calendar_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_calendar_sync_id UUID NOT NULL REFERENCES member_calendar_sync(id) ON DELETE CASCADE,
    google_calendar_event_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_event_calendar_mapping UNIQUE (event_id, member_calendar_sync_id)
);

-- Index for efficient lookups by event
CREATE INDEX IF NOT EXISTS idx_event_calendar_mapping_event_id ON event_calendar_mapping(event_id);

-- Index for efficient lookups by sync record
CREATE INDEX IF NOT EXISTS idx_event_calendar_mapping_sync_id ON event_calendar_mapping(member_calendar_sync_id);

-- =============================================================================
-- Updated at trigger for member_calendar_sync
-- =============================================================================
CREATE OR REPLACE FUNCTION update_member_calendar_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_calendar_sync_updated_at ON member_calendar_sync;
CREATE TRIGGER trigger_update_member_calendar_sync_updated_at
    BEFORE UPDATE ON member_calendar_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_member_calendar_sync_updated_at();

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE member_calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_calendar_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calendar sync records
CREATE POLICY "Users can view their own calendar sync"
    ON member_calendar_sync
    FOR SELECT
    USING (
        membership_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own calendar sync records
CREATE POLICY "Users can insert their own calendar sync"
    ON member_calendar_sync
    FOR INSERT
    WITH CHECK (
        membership_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own calendar sync records
CREATE POLICY "Users can update their own calendar sync"
    ON member_calendar_sync
    FOR UPDATE
    USING (
        membership_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own calendar sync records
CREATE POLICY "Users can delete their own calendar sync"
    ON member_calendar_sync
    FOR DELETE
    USING (
        membership_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Service role can access all calendar sync records (for background sync)
CREATE POLICY "Service role can manage all calendar sync"
    ON member_calendar_sync
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Users can view their own event calendar mappings
CREATE POLICY "Users can view their own event calendar mappings"
    ON event_calendar_mapping
    FOR SELECT
    USING (
        member_calendar_sync_id IN (
            SELECT mcs.id FROM member_calendar_sync mcs
            JOIN organization_members om ON om.id = mcs.membership_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Service role can manage all event calendar mappings (for sync operations)
CREATE POLICY "Service role can manage all event calendar mappings"
    ON event_calendar_mapping
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- Helper function to get active calendar syncs for an organization
-- =============================================================================
CREATE OR REPLACE FUNCTION get_active_calendar_syncs_for_org(org_id UUID)
RETURNS TABLE (
    sync_id UUID,
    membership_id UUID,
    user_id UUID,
    google_refresh_token_encrypted TEXT,
    google_access_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mcs.id AS sync_id,
        mcs.membership_id,
        om.user_id,
        mcs.google_refresh_token_encrypted,
        mcs.google_access_token_encrypted,
        mcs.token_expires_at
    FROM member_calendar_sync mcs
    JOIN organization_members om ON om.id = mcs.membership_id
    WHERE om.organization_id = org_id
    AND mcs.sync_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_calendar_syncs_for_org(UUID) TO authenticated;

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE member_calendar_sync IS 'Stores encrypted Google OAuth tokens for calendar sync per organization membership';
COMMENT ON COLUMN member_calendar_sync.sync_status IS 'Status of calendar sync: active (working), failed (needs reconnection), disconnected (user disabled)';
COMMENT ON COLUMN member_calendar_sync.google_refresh_token_encrypted IS 'AES-256-GCM encrypted Google OAuth refresh token';
COMMENT ON COLUMN member_calendar_sync.google_access_token_encrypted IS 'AES-256-GCM encrypted Google OAuth access token';

COMMENT ON TABLE event_calendar_mapping IS 'Maps organization events to Google Calendar event IDs for each synced member';
COMMENT ON COLUMN event_calendar_mapping.google_calendar_event_id IS 'The Google Calendar event ID returned when creating/updating the event';
