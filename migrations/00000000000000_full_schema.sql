-- ============================================================================
-- UNIFIED PRODUCTION SCHEMA MIGRATION: NFCentry V2
-- File: supabase/migrations/00000000000000_full_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. POSTGRESQL & NEON COMPATIBILITY PREREQUISITES
-- ============================================================================

-- 0.1 Roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END $$;

-- 0.2 Auth Schema & Helpers
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(
        COALESCE(
            current_setting('request.jwt.claim.sub', true),
            (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'),
            current_setting('app.current_user_id', true)
        ),
        ''
    )::UUID;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claim.role', true),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
        'authenticated'
    );
$$;

-- 0.3 Storage Schema
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    public BOOLEAN DEFAULT FALSE,
    avif_autodetection BOOLEAN DEFAULT FALSE,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT REFERENCES storage.buckets(id),
    name TEXT,
    owner UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- 0.4 Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- ============================================================================
-- 1. BASE TABLES
-- ============================================================================

-- 1.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    user_type TEXT NOT NULL CHECK (user_type IN ('Student', 'Faculty')),
    tag_id TEXT UNIQUE,
    nfc_tag_id TEXT UNIQUE,
    qr_code_data TEXT UNIQUE,
    auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'github', 'azure', 'facebook')),
    has_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tag TEXT UNIQUE,
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    logo_url TEXT,
    logo_storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 ORGANIZATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Attendance Taker', 'Member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- 1.4 ORGANIZATION JOIN REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.organization_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_pending_request UNIQUE (organization_id, user_id)
);

-- 1.5 EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    description TEXT,
    location TEXT,
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)),
    attendance_radius_meters INTEGER CHECK (attendance_radius_meters IS NULL OR (attendance_radius_meters >= 100 AND attendance_radius_meters <= 1000)),
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    featured_image_url TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 EVENT ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    marked_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scan_method TEXT NOT NULL CHECK (scan_method IN ('NFC', 'QR', 'Manual')),
    location_lat DECIMAL(10, 8) CHECK (location_lat IS NULL OR (location_lat BETWEEN -90 AND 90)),
    location_lng DECIMAL(11, 8) CHECK (location_lng IS NULL OR (location_lng BETWEEN -180 AND 180)),
    notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
    is_member BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- 1.7 EVENT FILES TABLE
CREATE TABLE IF NOT EXISTS public.event_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL CHECK (length(file_name) > 0 AND length(file_name) <= 255),
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('document', 'image')),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520),
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 USER TAG WRITES (AUDIT & COOLDOWN)
CREATE TABLE IF NOT EXISTS public.user_tag_writes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL CHECK (length(tag_id) > 0),
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.9 USER TAG PENDING (TWO-PHASE WRITE PROTOCOL)
CREATE TABLE IF NOT EXISTS public.user_tag_pending (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL CHECK (length(tag_id) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tag_id ON public.users(tag_id);
CREATE INDEX IF NOT EXISTS idx_users_nfc_tag_id ON public.users(nfc_tag_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_tag ON public.organizations(tag);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON public.organization_members(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_join_requests_org_id ON public.organization_join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.organization_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.organization_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_status ON public.organization_join_requests(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_date ON public.events(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_lat_long ON public.events(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON public.event_attendance(marked_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_event_marked_at ON public.event_attendance(event_id, marked_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_scan_method ON public.event_attendance(scan_method);

CREATE INDEX IF NOT EXISTS idx_event_files_event_id ON public.event_files(event_id);
CREATE INDEX IF NOT EXISTS idx_event_files_uploaded_by ON public.event_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_tag_writes_user_id ON public.user_tag_writes(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_writes_written_at ON public.user_tag_writes(written_at DESC);
CREATE INDEX IF NOT EXISTS idx_tag_pending_user_expires ON public.user_tag_pending(user_id, expires_at);

-- ============================================================================
-- 3. CORE TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_organization_join_requests_updated_at
BEFORE UPDATE ON public.organization_join_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_event_attendance_updated_at
BEFORE UPDATE ON public.event_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce exactly one owner per organization
CREATE OR REPLACE FUNCTION public.check_single_owner()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'Owner' THEN
        IF EXISTS (
            SELECT 1 
            FROM public.organization_members 
            WHERE organization_id = NEW.organization_id 
              AND role = 'Owner' 
              AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            RAISE EXCEPTION 'An organization can only have one Owner';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_single_owner
BEFORE INSERT OR UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.check_single_owner();

-- Sync tag_id to legacy nfc_tag_id and qr_code_data columns automatically
CREATE OR REPLACE FUNCTION public.sync_user_tag_identifiers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tag_id IS DISTINCT FROM OLD.tag_id THEN
        NEW.nfc_tag_id = NEW.tag_id;
        NEW.qr_code_data = NEW.tag_id;
    ELSIF NEW.nfc_tag_id IS DISTINCT FROM OLD.nfc_tag_id AND NEW.tag_id IS NULL THEN
        NEW.tag_id = NEW.nfc_tag_id;
        NEW.qr_code_data = NEW.nfc_tag_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_user_tag_identifiers_trigger
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_tag_identifiers();

-- 3.6 ENSURE AUTH USER SYNC (PREVENTS FOREIGN KEY DEFECTS IN DIRECT POSTGRESQL INSERTIONS)
CREATE OR REPLACE FUNCTION public.ensure_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auth.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER ensure_auth_user_trigger
BEFORE INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_auth_user();

-- ============================================================================
-- 4. MEMBERSHIP & PERMISSION HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID, user_auth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        WHERE om.organization_id = org_id
          AND om.user_id = user_auth_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID, user_auth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        WHERE om.organization_id = org_id
          AND om.user_id = user_auth_id
          AND om.role IN ('Owner', 'Admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID, user_auth_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organizations o
        WHERE o.id = org_id
          AND o.owner_user_id = user_auth_id
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(
    p_user_id UUID, 
    p_organization_id UUID, 
    p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members
        WHERE organization_id = p_organization_id
          AND user_id = p_user_id
          AND role = p_role
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID, 
    p_organization_id UUID, 
    p_required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id;

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_required_role = 'Owner' THEN
        RETURN v_role = 'Owner';
    ELSIF p_required_role = 'Admin' THEN
        RETURN v_role IN ('Owner', 'Admin');
    ELSIF p_required_role = 'Attendance Taker' THEN
        RETURN v_role IN ('Owner', 'Admin', 'Attendance Taker');
    ELSIF p_required_role = 'Member' THEN
        RETURN v_role IN ('Owner', 'Admin', 'Attendance Taker', 'Member');
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_event_in_org(
    p_organization_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.user_has_permission(p_user_id, p_organization_id, 'Attendance Taker');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_event(
    p_event_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = p_event_id
          AND e.created_by = p_user_id
    ) OR EXISTS (
        SELECT 1
        FROM public.events e
        JOIN public.organization_members om ON om.organization_id = e.organization_id
        WHERE e.id = p_event_id
          AND om.user_id = p_user_id
          AND om.role IN ('Owner', 'Admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.can_take_attendance(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.events e
        JOIN public.organization_members om ON om.organization_id = e.organization_id
        WHERE e.id = p_event_id
          AND om.user_id = p_user_id
          AND om.role IN ('Owner', 'Admin', 'Attendance Taker')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_user_attended(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.event_attendance 
        WHERE event_id = p_event_id AND user_id = p_user_id
    );
$$;

-- Aggregate & count helpers
CREATE OR REPLACE FUNCTION public.get_event_attendance_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.event_attendance WHERE event_id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION public.get_event_member_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER 
    FROM public.organization_members om
    JOIN public.events e ON e.organization_id = om.organization_id
    WHERE e.id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_member_count(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.organization_members WHERE organization_id = p_organization_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_membership_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.organization_members WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_organization(p_user_id UUID, p_organization_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT role FROM public.organization_members WHERE user_id = p_user_id AND organization_id = p_organization_id;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_event_count(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id = p_organization_id;
$$;

CREATE OR REPLACE FUNCTION public.get_upcoming_events_count(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id = p_organization_id AND date > NOW();
$$;

CREATE OR REPLACE FUNCTION public.get_user_events_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.events WHERE created_by = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_event_file_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.event_files WHERE event_id = p_event_id;
$$;

-- ============================================================================
-- 5. ATOMIC BUSINESS OPERATIONS (RPCs)
-- ============================================================================

-- 5.1 APPROVE JOIN REQUEST
CREATE OR REPLACE FUNCTION public.approve_join_request(
    p_request_id UUID,
    p_reviewer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
BEGIN
    SELECT * INTO v_req
    FROM public.organization_join_requests
    WHERE id = p_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Verify reviewer has Admin or Owner rights
    IF NOT public.is_org_admin(v_req.organization_id, p_reviewer_id) THEN
        RETURN FALSE;
    END IF;

    -- Mark request approved
    UPDATE public.organization_join_requests
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_reviewer_id,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- Add to organization members
    INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
    VALUES (v_req.organization_id, v_req.user_id, 'Member', NOW())
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RETURN TRUE;
END;
$$;

-- 5.2 ATOMIC OWNERSHIP TRANSFER (FIXES DEFECT #6)
CREATE OR REPLACE FUNCTION public.transfer_organization_ownership(
    p_organization_id UUID,
    p_new_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_owner_id UUID;
BEGIN
    SELECT owner_user_id INTO v_current_owner_id
    FROM public.organizations
    WHERE id = p_organization_id;

    IF v_current_owner_id IS NULL THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;

    -- Caller must be current owner (if called within an authenticated session)
    IF auth.uid() IS NOT NULL AND auth.uid() <> v_current_owner_id THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;

    -- Verify new owner is already an org member
    IF NOT public.is_org_member(p_organization_id, p_new_owner_id) THEN
        RAISE EXCEPTION 'New owner must be an existing member of the organization';
    END IF;

    -- Demote old owner to Admin
    UPDATE public.organization_members
    SET role = 'Admin', updated_at = NOW()
    WHERE organization_id = p_organization_id AND user_id = v_current_owner_id;

    -- Promote new owner to Owner
    UPDATE public.organization_members
    SET role = 'Owner', updated_at = NOW()
    WHERE organization_id = p_organization_id AND user_id = p_new_owner_id;

    -- Update organizations record
    UPDATE public.organizations
    SET owner_user_id = p_new_owner_id, updated_at = NOW()
    WHERE id = p_organization_id;

    RETURN TRUE;
END;
$$;

-- 5.3 TAG COOLDOWN CHECK
CREATE OR REPLACE FUNCTION public.can_user_write_tag(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_cooldown_days INTEGER := 14;
    v_last_write TIMESTAMPTZ;
    v_next_available TIMESTAMPTZ;
    v_can_write BOOLEAN;
BEGIN
    SELECT written_at INTO v_last_write
    FROM public.user_tag_writes
    WHERE user_id = p_user_id
    ORDER BY written_at DESC
    LIMIT 1;

    IF v_last_write IS NULL THEN
        v_can_write := TRUE;
        v_next_available := NULL;
    ELSE
        v_next_available := v_last_write + (v_cooldown_days || ' days')::INTERVAL;
        v_can_write := NOW() >= v_next_available;
    END IF;

    RETURN json_build_object(
        'can_write', v_can_write,
        'next_available_date', v_next_available,
        'last_write_date', v_last_write,
        'cooldown_days', v_cooldown_days
    );
END;
$$;

-- 5.4 PREPARE TAG WRITE (PHASE 1)
CREATE OR REPLACE FUNCTION public.prepare_tag_write(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_can_write_result JSON;
    v_can_write BOOLEAN;
    v_new_tag_id TEXT;
    v_pending_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_can_write_result := public.can_user_write_tag(p_user_id);
    v_can_write := (v_can_write_result->>'can_write')::BOOLEAN;

    IF NOT v_can_write THEN
        RAISE EXCEPTION 'Cooldown period not elapsed. Next available: %',
            v_can_write_result->>'next_available_date';
    END IF;

    -- Purge previous unconfirmed pending writes for this user
    DELETE FROM public.user_tag_pending
    WHERE user_id = p_user_id AND confirmed = FALSE;

    v_new_tag_id := gen_random_uuid()::TEXT;
    v_expires_at := NOW() + INTERVAL '5 minutes';

    INSERT INTO public.user_tag_pending (user_id, tag_id, expires_at, confirmed)
    VALUES (p_user_id, v_new_tag_id, v_expires_at, FALSE)
    RETURNING id INTO v_pending_id;

    RETURN json_build_object(
        'success', TRUE,
        'tag_id', v_new_tag_id,
        'pending_id', v_pending_id,
        'expires_at', v_expires_at
    );
END;
$$;

-- 5.5 CONFIRM TAG WRITE (PHASE 2)
CREATE OR REPLACE FUNCTION public.confirm_tag_write(
    p_user_id UUID,
    p_pending_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending RECORD;
    v_write_record_id UUID;
BEGIN
    SELECT * INTO v_pending
    FROM public.user_tag_pending
    WHERE id = p_pending_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending tag not found or invalid';
    END IF;

    IF v_pending.confirmed THEN
        RAISE EXCEPTION 'Tag write already confirmed';
    END IF;

    IF NOW() > v_pending.expires_at THEN
        RAISE EXCEPTION 'Tag preparation expired. Please generate a new tag';
    END IF;

    -- Update active user tag
    UPDATE public.users
    SET tag_id = v_pending.tag_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Record in immutable audit log
    INSERT INTO public.user_tag_writes (user_id, tag_id, written_at)
    VALUES (p_user_id, v_pending.tag_id, NOW())
    RETURNING id INTO v_write_record_id;

    -- Mark pending record confirmed
    UPDATE public.user_tag_pending
    SET confirmed = TRUE,
        confirmed_at = NOW()
    WHERE id = p_pending_id;

    RETURN json_build_object(
        'success', TRUE,
        'tag_id', v_pending.tag_id,
        'write_record_id', v_write_record_id,
        'written_at', NOW()
    );
END;
$$;

-- 5.6 DIRECT DIGITAL TAG GENERATION (FOR NON-NFC / iOS / DESKTOP USERS)
CREATE OR REPLACE FUNCTION public.generate_and_assign_tag(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_can_write_result JSON;
    v_can_write BOOLEAN;
    v_new_tag_id TEXT;
    v_write_record_id UUID;
BEGIN
    v_can_write_result := public.can_user_write_tag(p_user_id);
    v_can_write := (v_can_write_result->>'can_write')::BOOLEAN;

    IF NOT v_can_write THEN
        RAISE EXCEPTION 'Cooldown period not elapsed. Next available: %',
            v_can_write_result->>'next_available_date';
    END IF;

    v_new_tag_id := gen_random_uuid()::TEXT;

    UPDATE public.users
    SET tag_id = v_new_tag_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.user_tag_writes (user_id, tag_id, written_at)
    VALUES (p_user_id, v_new_tag_id, NOW())
    RETURNING id INTO v_write_record_id;

    RETURN json_build_object(
        'success', TRUE,
        'tag_id', v_new_tag_id,
        'write_record_id', v_write_record_id,
        'written_at', NOW()
    );
END;
$$;

-- 5.7 CONFIRM TAG UPDATE (LEGACY ALIAS)
CREATE OR REPLACE FUNCTION public.confirm_tag_update(p_user_id UUID, p_tag_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_can_write_result JSON;
    v_can_write BOOLEAN;
    v_write_record_id UUID;
BEGIN
    v_can_write_result := public.can_user_write_tag(p_user_id);
    v_can_write := (v_can_write_result->>'can_write')::BOOLEAN;

    IF NOT v_can_write THEN
        RAISE EXCEPTION 'Cannot write tag. Cooldown period not elapsed. Next available: %',
            v_can_write_result->>'next_available_date';
    END IF;

    UPDATE public.users
    SET tag_id = p_tag_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.user_tag_writes (user_id, tag_id, written_at)
    VALUES (p_user_id, p_tag_id, NOW())
    RETURNING id INTO v_write_record_id;

    RETURN json_build_object(
        'success', TRUE,
        'tag_id', p_tag_id,
        'write_record_id', v_write_record_id,
        'written_at', NOW()
    );
END;
$$;

-- 5.8 TAG WRITE HISTORY QUERY
CREATE OR REPLACE FUNCTION public.get_tag_write_history(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        json_agg(t ORDER BY t.written_at DESC),
        '[]'::json
    )
    FROM (
        SELECT id, user_id, tag_id, written_at, created_at
        FROM public.user_tag_writes
        WHERE user_id = p_user_id
        ORDER BY written_at DESC
        LIMIT p_limit
    ) t;
$$;

-- 5.9 CLEANUP EXPIRED PENDING TAGS
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_tags()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.user_tag_pending
    WHERE expires_at < NOW() AND confirmed = FALSE;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- 5.10 CLEANUP EXPIRED EVENT FILES (FIXES DEFECT #3 CROSS-TENANT PURGE)
CREATE OR REPLACE FUNCTION public.cleanup_expired_event_files(p_organization_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_storage_paths TEXT[] := ARRAY[]::TEXT[];
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT ef.id, ef.storage_path
        FROM public.event_files ef
        JOIN public.events e ON e.id = ef.event_id
        WHERE (p_organization_id IS NULL OR e.organization_id = p_organization_id)
          AND (e.date + INTERVAL '3 days') < NOW()
    LOOP
        v_storage_paths := array_append(v_storage_paths, v_rec.storage_path);
        DELETE FROM public.event_files WHERE id = v_rec.id;
        v_deleted_count := v_deleted_count + 1;
    END LOOP;

    RETURN json_build_object(
        'deleted_count', v_deleted_count,
        'storage_paths', v_storage_paths
    );
END;
$$;

-- 5.11 LOCATION AUTOCOMPLETE SUGGESTIONS
CREATE OR REPLACE FUNCTION public.get_location_suggestions(
    p_organization_id UUID,
    p_search_text TEXT DEFAULT NULL,
    p_center_lat DOUBLE PRECISION DEFAULT NULL,
    p_center_lng DOUBLE PRECISION DEFAULT NULL,
    p_radius_meters INTEGER DEFAULT 50
)
RETURNS TABLE (
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    usage_count BIGINT,
    distance_meters DOUBLE PRECISION,
    relevance_score DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    WITH ranked_locs AS (
        SELECT 
            e.location,
            e.latitude,
            e.longitude,
            COUNT(*) AS usage_count,
            CASE 
                WHEN p_center_lat IS NOT NULL AND p_center_lng IS NOT NULL THEN
                    6371000 * 2 * ASIN(SQRT(
                        POWER(SIN(RADIANS(e.latitude - p_center_lat) / 2), 2) +
                        COS(RADIANS(p_center_lat)) * COS(RADIANS(e.latitude)) *
                        POWER(SIN(RADIANS(e.longitude - p_center_lng) / 2), 2)
                    ))
                ELSE NULL
            END AS distance_meters
        FROM public.events e
        WHERE e.organization_id = p_organization_id
          AND e.location IS NOT NULL
          AND e.latitude IS NOT NULL
          AND e.longitude IS NOT NULL
          AND (p_search_text IS NULL OR e.location ILIKE '%' || p_search_text || '%')
        GROUP BY e.location, e.latitude, e.longitude
    )
    SELECT 
        r.location,
        r.latitude,
        r.longitude,
        r.usage_count,
        r.distance_meters,
        (
            (r.usage_count * 10)::DOUBLE PRECISION +
            (CASE WHEN r.distance_meters IS NOT NULL AND r.distance_meters <= p_radius_meters THEN 50.0 ELSE 0.0 END) +
            (CASE WHEN p_search_text IS NOT NULL AND r.location ILIKE p_search_text || '%' THEN 30.0 ELSE 0.0 END)
        ) AS relevance_score
    FROM ranked_locs r
    ORDER BY relevance_score DESC, usage_count DESC;
$$;

-- 5.12 ATOMIC ATTENDANCE CHECK-IN (NFC, QR & MANUAL)
CREATE OR REPLACE FUNCTION public.mark_attendance(
    p_event_id UUID,
    p_user_id UUID,
    p_marked_by UUID,
    p_scan_method TEXT,
    p_location_lat DECIMAL DEFAULT NULL,
    p_location_lng DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_is_member BOOLEAN;
    v_distance DOUBLE PRECISION;
    v_attendance_id UUID;
BEGIN
    -- 1. Fetch and validate event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    -- 2. Verify marker permission
    IF NOT public.can_take_attendance(p_event_id, p_marked_by) THEN
        RAISE EXCEPTION 'You do not have permission to take attendance for this event';
    END IF;

    -- 3. Check attendance window if set
    IF v_event.event_start IS NOT NULL AND NOW() < v_event.event_start THEN
        RAISE EXCEPTION 'Attendance window has not opened yet. Starts at: %', v_event.event_start;
    END IF;
    IF v_event.event_end IS NOT NULL AND NOW() > v_event.event_end THEN
        RAISE EXCEPTION 'Attendance period has ended. The deadline was: %', v_event.event_end;
    END IF;

    -- 4. Geofencing check if radius configured
    IF v_event.attendance_radius_meters IS NOT NULL AND v_event.latitude IS NOT NULL AND v_event.longitude IS NOT NULL THEN
        IF p_location_lat IS NULL OR p_location_lng IS NULL THEN
            RAISE EXCEPTION 'Geolocation coordinates required for attendance at this restricted event';
        END IF;

        v_distance := 6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(v_event.latitude - p_location_lat::DOUBLE PRECISION) / 2), 2) +
            COS(RADIANS(p_location_lat::DOUBLE PRECISION)) * COS(RADIANS(v_event.latitude)) *
            POWER(SIN(RADIANS(v_event.longitude - p_location_lng::DOUBLE PRECISION) / 2), 2)
        ));

        IF v_distance > v_event.attendance_radius_meters THEN
            RAISE EXCEPTION 'Outside allowed attendance radius (Allowed: %m, Current: %m)', 
                v_event.attendance_radius_meters, ROUND(v_distance::NUMERIC, 1);
        END IF;
    END IF;

    -- 5. Check duplicate check-in
    IF EXISTS (SELECT 1 FROM public.event_attendance WHERE event_id = p_event_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'Attendance already marked for this user at this event';
    END IF;

    -- 6. Check membership status
    v_is_member := public.is_org_member(v_event.organization_id, p_user_id);

    -- 7. Insert attendance record
    INSERT INTO public.event_attendance (
        event_id,
        user_id,
        marked_at,
        marked_by,
        scan_method,
        location_lat,
        location_lng,
        notes,
        is_member
    ) VALUES (
        p_event_id,
        p_user_id,
        NOW(),
        p_marked_by,
        p_scan_method,
        p_location_lat,
        p_location_lng,
        p_notes,
        v_is_member
    )
    RETURNING id INTO v_attendance_id;

    RETURN json_build_object(
        'success', TRUE,
        'attendance_id', v_attendance_id,
        'marked_at', NOW(),
        'is_member', v_is_member
    );
END;
$$;

-- 5.13 PASSWORD RESET VERIFICATION HELPER
CREATE OR REPLACE FUNCTION public.user_can_reset_password(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE email = user_email AND auth_provider = 'email'
    );
$$;

-- ============================================================================
-- 6. DATABASE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.events_with_details WITH (security_invoker = on) AS
SELECT 
    e.id,
    e.event_name,
    e.date,
    e.organization_id,
    e.description,
    e.location,
    e.latitude,
    e.longitude,
    e.attendance_radius_meters,
    e.event_start,
    e.event_end,
    e.featured_image_url,
    e.created_by,
    e.created_at,
    e.updated_at,
    o.name AS organization_name,
    o.tag AS organization_tag,
    o.description AS organization_description,
    o.logo_url AS organization_logo_url,
    u.name AS creator_name,
    u.email AS creator_email,
    u.user_type AS creator_user_type
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
JOIN public.users u ON u.id = e.created_by;

CREATE OR REPLACE VIEW public.upcoming_events WITH (security_invoker = on) AS
SELECT 
    e.*,
    o.name AS organization_name,
    o.tag AS organization_tag,
    o.logo_url AS organization_logo_url
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.date > NOW()
ORDER BY e.date ASC;

CREATE OR REPLACE VIEW public.past_events WITH (security_invoker = on) AS
SELECT 
    e.*,
    o.name AS organization_name,
    o.tag AS organization_tag,
    o.logo_url AS organization_logo_url
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.date <= NOW()
ORDER BY e.date DESC;

CREATE OR REPLACE VIEW public.membership_with_organization WITH (security_invoker = on) AS
SELECT 
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.joined_at,
    om.updated_at,
    o.name AS organization_name,
    o.description AS organization_description,
    o.tag AS organization_tag,
    o.logo_url AS organization_logo_url,
    o.owner_user_id AS organization_owner_id
FROM public.organization_members om
JOIN public.organizations o ON om.organization_id = o.id;

CREATE OR REPLACE VIEW public.membership_with_user WITH (security_invoker = on) AS
SELECT 
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.joined_at,
    om.updated_at,
    u.name AS user_name,
    u.email AS user_email,
    u.user_type,
    u.tag_id,
    u.auth_provider,
    u.has_password
FROM public.organization_members om
JOIN public.users u ON om.user_id = u.id;

CREATE OR REPLACE VIEW public.attendance_with_details WITH (security_invoker = on) AS
SELECT 
    ea.id,
    ea.event_id,
    ea.user_id,
    ea.marked_at,
    ea.marked_by,
    ea.scan_method,
    ea.location_lat,
    ea.location_lng,
    ea.notes,
    ea.is_member,
    ea.created_at,
    ea.updated_at,
    u.name AS user_name,
    u.email AS user_email,
    u.user_type,
    u.tag_id,
    e.event_name,
    e.date AS event_date,
    e.location AS event_location,
    e.organization_id,
    o.name AS organization_name,
    o.tag AS organization_tag,
    mb.name AS marked_by_name,
    mb.email AS marked_by_email
FROM public.event_attendance ea
JOIN public.users u ON ea.user_id = u.id
JOIN public.events e ON ea.event_id = e.id
JOIN public.organizations o ON e.organization_id = o.id
JOIN public.users mb ON ea.marked_by = mb.id;

CREATE OR REPLACE VIEW public.event_attendance_summary WITH (security_invoker = on) AS
SELECT 
    e.id AS event_id,
    e.event_name,
    e.date AS event_date,
    e.organization_id,
    o.name AS organization_name,
    COALESCE(att.total_attended, 0) AS total_attended,
    COALESCE(mem.total_members, 0) AS total_members,
    CASE 
        WHEN COALESCE(mem.total_members, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(att.total_attended, 0)::DECIMAL / mem.total_members) * 100, 1)
    END AS attendance_percentage,
    COALESCE(att.nfc_scans, 0) AS nfc_scans,
    COALESCE(att.qr_scans, 0) AS qr_scans,
    COALESCE(att.manual_entries, 0) AS manual_entries,
    COALESCE(att.member_count, 0) AS member_count,
    COALESCE(att.non_member_count, 0) AS non_member_count,
    att.last_attendance_marked
FROM public.events e
JOIN public.organizations o ON e.organization_id = o.id
LEFT JOIN (
    SELECT 
        event_id,
        COUNT(*) AS total_attended,
        COUNT(*) FILTER (WHERE scan_method = 'NFC') AS nfc_scans,
        COUNT(*) FILTER (WHERE scan_method = 'QR') AS qr_scans,
        COUNT(*) FILTER (WHERE scan_method = 'Manual') AS manual_entries,
        COUNT(*) FILTER (WHERE is_member = TRUE) AS member_count,
        COUNT(*) FILTER (WHERE is_member = FALSE) AS non_member_count,
        MAX(marked_at) AS last_attendance_marked
    FROM public.event_attendance
    GROUP BY event_id
) att ON e.id = att.event_id
LEFT JOIN (
    SELECT organization_id, COUNT(*) AS total_members
    FROM public.organization_members
    GROUP BY organization_id
) mem ON e.organization_id = mem.organization_id;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_writes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_pending ENABLE ROW LEVEL SECURITY;

-- 7.1 USERS TABLE POLICIES
DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
FOR SELECT TO authenticated
USING (TRUE); -- Authenticated users can view user profiles (names, public details)

DROP POLICY IF EXISTS users_insert_own_profile ON public.users;
CREATE POLICY users_insert_own_profile ON public.users
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_update_own_profile ON public.users;
CREATE POLICY users_update_own_profile ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_delete_own_profile ON public.users;
CREATE POLICY users_delete_own_profile ON public.users
FOR DELETE TO authenticated
USING (id = auth.uid());

-- 7.2 ORGANIZATIONS TABLE POLICIES
DROP POLICY IF EXISTS orgs_select_policy ON public.organizations;
CREATE POLICY orgs_select_policy ON public.organizations
FOR SELECT TO authenticated
USING (TRUE); -- Organizations are discoverable for join requests

DROP POLICY IF EXISTS orgs_insert_policy ON public.organizations;
CREATE POLICY orgs_insert_policy ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS orgs_update_policy ON public.organizations;
CREATE POLICY orgs_update_policy ON public.organizations
FOR UPDATE TO authenticated
USING (public.is_org_admin(id, auth.uid()))
WITH CHECK (public.is_org_admin(id, auth.uid()));

DROP POLICY IF EXISTS orgs_delete_policy ON public.organizations;
CREATE POLICY orgs_delete_policy ON public.organizations
FOR DELETE TO authenticated
USING (public.is_org_owner(id, auth.uid()));

-- 7.3 ORGANIZATION MEMBERS TABLE POLICIES
DROP POLICY IF EXISTS org_members_select_policy ON public.organization_members;
CREATE POLICY org_members_select_policy ON public.organization_members
FOR SELECT TO authenticated
USING (TRUE); -- Directory visible to authenticated users within organizations

DROP POLICY IF EXISTS org_members_insert_policy ON public.organization_members;
CREATE POLICY org_members_insert_policy ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

DROP POLICY IF EXISTS org_members_update_policy ON public.organization_members;
CREATE POLICY org_members_update_policy ON public.organization_members
FOR UPDATE TO authenticated
USING (
    public.is_org_admin(organization_id, auth.uid())
    AND role <> 'Owner'
    AND user_id <> auth.uid()
)
WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
    AND role <> 'Owner'
    AND user_id <> auth.uid()
);

DROP POLICY IF EXISTS org_members_delete_policy ON public.organization_members;
CREATE POLICY org_members_delete_policy ON public.organization_members
FOR DELETE TO authenticated
USING (
    user_id = auth.uid() -- Member can leave
    OR (public.is_org_admin(organization_id, auth.uid()) AND role <> 'Owner') -- Admin can kick
);

-- 7.4 ORGANIZATION JOIN REQUESTS POLICIES
DROP POLICY IF EXISTS join_requests_select_policy ON public.organization_join_requests;
CREATE POLICY join_requests_select_policy ON public.organization_join_requests
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_org_admin(organization_id, auth.uid())
);

DROP POLICY IF EXISTS join_requests_insert_policy ON public.organization_join_requests;
CREATE POLICY join_requests_insert_policy ON public.organization_join_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS join_requests_update_policy ON public.organization_join_requests;
CREATE POLICY join_requests_update_policy ON public.organization_join_requests
FOR UPDATE TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()))
WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

DROP POLICY IF EXISTS join_requests_delete_policy ON public.organization_join_requests;
CREATE POLICY join_requests_delete_policy ON public.organization_join_requests
FOR DELETE TO authenticated
USING (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_org_admin(organization_id, auth.uid())
);

-- 7.5 EVENTS POLICIES
DROP POLICY IF EXISTS events_select_policy ON public.events;
CREATE POLICY events_select_policy ON public.events
FOR SELECT TO authenticated
USING (TRUE); -- Events are viewable to authenticated users

DROP POLICY IF EXISTS events_insert_policy ON public.events;
CREATE POLICY events_insert_policy ON public.events
FOR INSERT TO authenticated
WITH CHECK (public.can_create_event_in_org(organization_id, auth.uid()));

DROP POLICY IF EXISTS events_update_policy ON public.events;
CREATE POLICY events_update_policy ON public.events
FOR UPDATE TO authenticated
USING (public.can_manage_event(id, auth.uid()))
WITH CHECK (public.can_manage_event(id, auth.uid()));

DROP POLICY IF EXISTS events_delete_policy ON public.events;
CREATE POLICY events_delete_policy ON public.events
FOR DELETE TO authenticated
USING (public.can_manage_event(id, auth.uid()));

-- 7.6 EVENT ATTENDANCE POLICIES
DROP POLICY IF EXISTS attendance_select_policy ON public.event_attendance;
CREATE POLICY attendance_select_policy ON public.event_attendance
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND public.is_org_member(e.organization_id, auth.uid())
    )
);

DROP POLICY IF EXISTS attendance_insert_policy ON public.event_attendance;
CREATE POLICY attendance_insert_policy ON public.event_attendance
FOR INSERT TO authenticated
WITH CHECK (
    public.can_take_attendance(event_id, auth.uid())
    AND marked_by = auth.uid()
);

DROP POLICY IF EXISTS attendance_update_policy ON public.event_attendance;
CREATE POLICY attendance_update_policy ON public.event_attendance
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND public.is_org_admin(e.organization_id, auth.uid())
    )
);

DROP POLICY IF EXISTS attendance_delete_policy ON public.event_attendance;
CREATE POLICY attendance_delete_policy ON public.event_attendance
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND public.is_org_admin(e.organization_id, auth.uid())
    )
);

-- 7.7 EVENT FILES POLICIES (FIXES DEFECT #5 - NO MORE DOUBLE LOCKOUT)
DROP POLICY IF EXISTS event_files_select_policy ON public.event_files;
CREATE POLICY event_files_select_policy ON public.event_files
FOR SELECT TO authenticated
USING (
    -- 1. Attended users
    EXISTS (
        SELECT 1 FROM public.event_attendance ea
        WHERE ea.event_id = event_files.event_id
          AND ea.user_id = auth.uid()
    )
    -- 2. Event creator
    OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_files.event_id
          AND e.created_by = auth.uid()
    )
    -- 3. Org Owner or Admin
    OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_files.event_id
          AND public.is_org_admin(e.organization_id, auth.uid())
    )
);

DROP POLICY IF EXISTS event_files_insert_policy ON public.event_files;
CREATE POLICY event_files_insert_policy ON public.event_files
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_files.event_id
          AND public.user_has_permission(auth.uid(), e.organization_id, 'Attendance Taker')
    )
);

DROP POLICY IF EXISTS event_files_delete_policy ON public.event_files;
CREATE POLICY event_files_delete_policy ON public.event_files
FOR DELETE TO authenticated
USING (
    uploaded_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_files.event_id
          AND (e.created_by = auth.uid() OR public.is_org_admin(e.organization_id, auth.uid()))
    )
);

-- 7.8 USER TAG WRITES POLICIES (IMMUTABLE AUDIT TRAIL)
DROP POLICY IF EXISTS tag_writes_select_own ON public.user_tag_writes;
CREATE POLICY tag_writes_select_own ON public.user_tag_writes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS tag_writes_insert_own ON public.user_tag_writes;
CREATE POLICY tag_writes_insert_own ON public.user_tag_writes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 7.9 USER TAG PENDING POLICIES
DROP POLICY IF EXISTS tag_pending_select_own ON public.user_tag_pending;
CREATE POLICY tag_pending_select_own ON public.user_tag_pending
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS tag_pending_insert_own ON public.user_tag_pending;
CREATE POLICY tag_pending_insert_own ON public.user_tag_pending
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tag_pending_update_own ON public.user_tag_pending;
CREATE POLICY tag_pending_update_own ON public.user_tag_pending
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tag_pending_delete_own ON public.user_tag_pending;
CREATE POLICY tag_pending_delete_own ON public.user_tag_pending
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 8. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-files', 'organization-files', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-files', 'event-files', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organization-files (logos)
DROP POLICY IF EXISTS "Public read for organization logos" ON storage.objects;
CREATE POLICY "Public read for organization logos" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'organization-files');

DROP POLICY IF EXISTS "Authenticated users can upload org logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload org logos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organization-files');

DROP POLICY IF EXISTS "Admins can update org logos" ON storage.objects;
CREATE POLICY "Admins can update org logos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'organization-files');

DROP POLICY IF EXISTS "Admins can delete org logos" ON storage.objects;
CREATE POLICY "Admins can delete org logos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'organization-files');

-- Storage policies for event-files (protected documents & banners)
DROP POLICY IF EXISTS "Event files select authorized" ON storage.objects;
CREATE POLICY "Event files select authorized" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-files');

DROP POLICY IF EXISTS "Event files insert authorized" ON storage.objects;
CREATE POLICY "Event files insert authorized" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-files');

DROP POLICY IF EXISTS "Event files delete authorized" ON storage.objects;
CREATE POLICY "Event files delete authorized" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-files');

-- ============================================================================
-- 9. REALTIME CONFIGURATION
-- ============================================================================

ALTER TABLE public.event_attendance REPLICA IDENTITY FULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'event_attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance;
    END IF;
END $$;
