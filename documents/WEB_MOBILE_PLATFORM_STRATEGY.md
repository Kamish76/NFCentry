# Web and Mobile Platform Strategy

## Purpose

This document defines the product split and integration strategy for the NFC attendance ecosystem:

- Web app remains the core platform for attendance tracking and organization management.
- Mobile app becomes the member-first companion focused on account management, tag management, notifications, and calendar reminders.
- Both platforms share the same backend domain and data model to avoid feature drift.

## Current Project Baseline (Web)

Repository: `batch-2025-nfc-attendance-system-web`

Core web strengths today:

- Multi-method attendance (NFC, QR, manual)
- Organization and membership management
- Event creation and attendance windows
- Role-based access control (Owner/Admin/Attendance Taker/Member)
- Unified tag identity used in both NFC and QR flows
- Supabase-based realtime + auth + PostgreSQL persistence

Web should continue as the system of record for:

- Organization setup and governance
- Event lifecycle management
- Administrative attendance operations
- Reporting and monitoring

## Product Direction

### High-Level Model

- **Web = Admin-first + Full visibility for all users**
- **Mobile = Member-first + Daily interaction channel**

This keeps the web app as the operational control center while improving member engagement and convenience through mobile.

### Important Constraint

Web NFC has browser/device limitations, so NFC tag writing/management is naturally stronger on mobile.

Decision:

- Keep NFC management workflows in mobile where device APIs are more practical.
- Keep equivalent read-only/member-view features available on web when possible.

## Capability Split

| Capability | Web | Mobile |
| --- | --- | --- |
| Login/Account management | Yes | Yes |
| Profile editing | Yes | Yes |
| Organization browsing and membership status | Yes | Yes |
| Admin org controls (roles, approvals, settings) | Primary | Limited/Optional |
| Event creation/editing | Primary | Limited/Optional |
| Event attendance participation view | Yes | Yes |
| Event reminders and push notifications | Basic (in-app/email) | Primary (push-first) |
| Calendar sync/reminder UX | Basic | Primary |
| NFC tag write/manage flows | Limited by Web NFC support | Primary |
| QR-based alternatives | Yes | Yes |
| Attendance analytics/reporting | Primary | Secondary summary |

## Principle: Do Not Limit Web to Admin Only

Web should still serve members and general users for:

- Viewing events and schedules
- Checking attendance history
- Managing account details
- Viewing membership and organization information

However, workflows that depend on stronger mobile hardware/API integration should remain mobile-first.

## Mobile App Scope (Member Side)

Primary goals:

- Faster account and profile updates
- Secure member tag management controls
- Better event engagement through reminders and calendar integration
- Better phone-native user experience for frequent member actions

Feature priorities:

1. Account management dashboard
2. Member tag management (view status, rotate/update flows based on policy)
3. Event reminder notifications (push)
4. Calendar integration (device calendar + app event list)
5. Member attendance timeline and event participation history

## Security Direction for Tag Management

Mobile app can improve tag security through controlled and auditable update flows.

Recommended controls:

- Short-lived challenge/verification before tag mutation
- Server-issued signed operations (no client-trusted tag updates)
- Rotation cooldown and risk flags (already aligned with existing tag cooldown policy)
- Device/session checks before sensitive actions
- Full audit logs for tag changes (who, when, old/new identifiers)

## Shared Backend and Integration Strategy

Use one backend domain and shared authorization model:

- Keep Supabase as the central auth/data platform
- Reuse existing role model and membership constraints
- Keep business rules in shared backend logic (API/service layer), not duplicated in clients

Integration guidelines:

- Define stable API contracts for member, tag, and event reminder workflows
- Add versioning for new mobile endpoints if behavior diverges
- Ensure both clients read/write the same canonical tables
- Keep notification and reminder scheduling server-driven

## Suggested Delivery Phases

### Phase 1: Architecture and Contract Alignment

- Finalize web vs mobile capability matrix
- Define shared API contracts and security constraints
- Identify DB changes needed for reminders/calendar preferences/tag audit metadata

### Phase 2: Mobile Foundation

- Implement authentication and account management
- Implement member profile and membership views
- Implement event list and event detail consumption from shared backend

### Phase 3: Tag and Notification Features

- Implement secure member tag management flow
- Implement push notification preferences and delivery pipeline
- Implement calendar reminder sync and schedule UX

### Phase 4: Cross-Platform Experience Polishing

- Align terminology and state labels between web and mobile
- Add shared analytics and audit visibility for admins on web
- Validate parity for member-readable features across both platforms

## Non-Goals (For Now)

- Replacing web admin operations with mobile workflows
- Creating separate databases for web and mobile
- Splitting auth into independent identity stores

## Success Metrics

- Reduced time for members to complete account/tag tasks
- Increased event attendance due to reminders
- Fewer tag-related support incidents
- No regression in web admin operations and reporting quality

## Summary

The web app remains the operational core for attendance and organization management, while the new mobile app becomes the member engagement layer focused on account actions, secure tag workflows, and event reminders. This split keeps the system scalable, practical with platform limitations, and aligned with the main mission: making attendance tracking and event management more accessible and reliable.
