# NFC Attendance System - Database + API Replication Checklist

This document pulls together the current database requirements and all API routes so you can replicate the project one step at a time.

## 1) Database replication order (one by one)

### Step 1: Core base tables
Create these first (in this order):
1. `users`
2. `organizations`
3. `organization_members`
4. `organization_join_requests`
5. `events`
6. `event_attendance`

Reference snapshot: `documents/CURRENT_DATABASE_STRUCTURE.sql`

### Step 2: Additional tables used by code/docs
These are required by API/features but are not listed in `CURRENT_DATABASE_STRUCTURE.sql` table overview:
1. `event_files` (used by event file upload APIs)
2. `user_tag_writes` (tag cooldown/history)
3. `user_tag_pending` (two-phase tag write flow)

Reference details:
- `documents/FILE_UPLOAD_DOCUMENTATION.md`
- `documents/TAG_MANAGEMENT_DOCUMENTATION.md`

### Step 3: Required helper/database functions
Create function layer before enabling all APIs:
- `is_org_member(org_id uuid, user_auth_id uuid)`
- `is_org_admin(org_id uuid, user_auth_id uuid)`
- `is_org_owner(org_id uuid, user_auth_id uuid)`
- `approve_join_request(...)`
- `cleanup_expired_event_files()`
- `can_user_write_tag(p_user_id uuid)`
- `prepare_tag_write(p_user_id uuid)`
- `confirm_tag_write(p_user_id uuid, p_pending_id uuid)`
- `get_tag_write_history(p_user_id uuid, p_limit int)`
- `generate_and_assign_tag(p_user_id uuid)` (legacy path still referenced)

### Step 4: RLS policies
Enable RLS and apply policies for:
- `users`
- `organizations`
- `organization_members`
- `organization_join_requests`
- `events`
- `event_attendance`
- `event_files` (if file upload enabled)
- `user_tag_writes` / `user_tag_pending` (if tag features enabled)

Important required membership policies are listed in:
- `documents/MEMBERSHIP_DOCUMENTATION.md`
- top section of `documents/CURRENT_DATABASE_STRUCTURE.sql`

### Step 5: Realtime + storage
- Add `event_attendance` to Supabase realtime publication (for live attendance updates)
- Create storage buckets:
  - `organization-files` (organization logos)
  - `event-files` (event attachments/featured images)

## 2) API replication order (one by one)

Implement routes group-by-group in this order to reduce dependency issues.

### Group A: User foundation
- `GET /api/user/profile-status`
- `POST /api/user/complete-profile`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/user/mark-password-set`
- `POST /api/user/check-password-reset`
- `GET /api/user/memberships`
- `GET /api/user/search`
- `GET /api/user/by-nfc`
- `GET /api/user/by-tag`

### Group B: Organization + membership
- `GET /api/organization`
- `POST /api/organization`
- `GET /api/organization/search`
- `GET /api/organization/[id]`
- `PUT /api/organization/[id]`
- `DELETE /api/organization/[id]`
- `GET /api/organization/[id]/members`
- `POST /api/organization/[id]/members`
- `GET /api/organization/[id]/members/[userId]`
- `PATCH /api/organization/[id]/members/[userId]`
- `DELETE /api/organization/[id]/members/[userId]`
- `GET /api/organization/[id]/join-requests`
- `GET /api/organization/[id]/events`
- `POST /api/organization/[id]/transfer-ownership`

- `GET /api/membership`
- `POST /api/membership`
- `GET /api/membership/[id]`
- `PATCH /api/membership/[id]`
- `DELETE /api/membership/[id]`
- `POST /api/membership/request`
- `POST /api/membership/approve`
- `POST /api/membership/reject`
- `POST /api/membership/transfer-ownership`
- `GET /api/membership/organization/[organizationId]`
- `GET /api/membership/organization/[organizationId]/requests`
- `GET /api/membership/user/[userId]`
- `GET /api/membership/user/[userId]/tags`

### Group C: Events + attendance
- `GET /api/event`
- `POST /api/event`
- `GET /api/event/[id]`
- `PUT /api/event/[id]`
- `DELETE /api/event/[id]`

- `GET /api/attendance`
- `POST /api/attendance`
- `GET /api/attendance/event/[id]`
- `GET /api/attendance/event/[id]/export`
- `PATCH /api/attendance/[id]`
- `DELETE /api/attendance/[id]`

### Group D: Files + tag management + admin utilities
- `GET /api/event/[id]/files`
- `POST /api/event/[id]/files`
- `DELETE /api/event/[id]/files`
- `POST /api/admin/cleanup-files`
- `GET /api/admin/cleanup-files`

- `GET /api/user/tag/can-write`
- `POST /api/user/tag/prepare`
- `POST /api/user/tag/confirm`
- `POST /api/user/tag/generate`
- `GET /api/user/tag/history`

### Group E: Misc
- `GET /api/theme`
- `POST /api/theme`

## 3) Source map for API routes

All route handlers are under:
- `src/app/api/**/route.ts`

Main feature docs:
- `documents/USER_DOCUMENTATION.md`
- `documents/ORGANIZATION_DOCUMENTATION.md`
- `documents/MEMBERSHIP_DOCUMENTATION.md`
- `documents/EVENT_DOCUMENTATION.md`
- `documents/ATTENDANCE_DOCUMENTATION.md`
- `documents/FILE_UPLOAD_DOCUMENTATION.md`
- `documents/TAG_MANAGEMENT_DOCUMENTATION.md`

## 4) Notes before cloning into a new project

1. `CURRENT_DATABASE_STRUCTURE.sql` appears to be missing newer feature tables (`event_files`, `user_tag_writes`, `user_tag_pending`) used in API and documentation.
2. Replicate DB functions and RLS policies together with tables; API behavior depends on both.
3. Confirm Supabase storage buckets and policy setup before testing file/tag endpoints.
