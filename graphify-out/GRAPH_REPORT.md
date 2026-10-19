# Graph Report - NFCentry redo  (2026-10-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 865 nodes · 2695 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04a83361`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- cn
- MembershipService
- auth-store.ts
- OrganizationService
- attendance.ts
- UserService
- dependencies
- EventService
- next
- package.json
- createClient
- map-picker.tsx
- components.json
- compilerOptions
- .getUserById
- tag.ts
- use-event-attendance-channel.ts
- datetime-picker.tsx
- OrganizationWithRole
- migrate.js
- devDependencies
- app/layout.tsx
- scripts
- .eslintrc.json
- calendar.tsx
- use-infinite-scroll.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 105 edges
2. `createClient()` - 99 edges
3. `next` - 93 edges
4. `Button()` - 75 edges
5. `react` - 60 edges
6. `Card()` - 58 edges
7. `CardContent()` - 54 edges
8. `UserService` - 49 edges
9. `CardHeader()` - 46 edges
10. `CardTitle()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `MapPreview()` --calls--> `Button()`  [EXTRACTED]
  src/components/events/map-preview.tsx → src/components/ui/button.tsx
- `POST` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/approve/route.ts → src/lib/supabase/server.ts
- `GET` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/organization/[organizationId]/requests/route.ts → src/lib/supabase/server.ts
- `POST` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/reject/route.ts → src/lib/supabase/server.ts
- `GET` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/user/memberships/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (98): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+90 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (90): class-variance-authority, cmdk, @radix-ui/react-dialog, @radix-ui/react-slot, AuthenticatedLayout(), AppSidebar(), navigationItems, OrganizationSettings() (+82 more)

### Community 2 - "MembershipService"
Cohesion: 0.09
Nodes (25): DELETE, GET, PATCH, GET, GET, POST, POST, GET (+17 more)

### Community 3 - "auth-store.ts"
Cohesion: 0.07
Nodes (38): zustand, RequestsViewProps, useAuth(), UseProfileStatusReturn, useUserProfile(), UseUserProfileReturn, initialState, useAuthError() (+30 more)

### Community 4 - "OrganizationService"
Cohesion: 0.12
Nodes (28): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+20 more)

### Community 5 - "attendance.ts"
Cohesion: 0.08
Nodes (27): xlsx, GET, GET, DELETE, PATCH, GET, POST, ScannedUser (+19 more)

### Community 6 - "UserService"
Cohesion: 0.09
Nodes (16): GET, POST(), POST, POST, GET, GET, POST, POST (+8 more)

### Community 7 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, cmdk, date-fns, dayjs (+30 more)

### Community 8 - "EventService"
Cohesion: 0.12
Nodes (18): DELETE, GET, PUT, GET, POST, GET, EditEventFormProps, EventPreview (+10 more)

### Community 9 - "next"
Cohesion: 0.12
Nodes (13): nextConfig, next, POST, GET, POST, POST, GET, GET (+5 more)

### Community 10 - "package.json"
Cohesion: 0.06
Nodes (30): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, clsx, dayjs, dotenv (+22 more)

### Community 11 - "createClient"
Cohesion: 0.14
Nodes (16): @supabase/supabase-js, POST, ALLOWED_MIME_TYPES, DELETE, GET, POST, GET(), CreateOrganizationPage() (+8 more)

### Community 12 - "map-picker.tsx"
Cohesion: 0.13
Nodes (19): leaflet, react-leaflet, currentMarkerIcon, historicalMarkerIcon, HistoricalMarkers(), HistoricalMarkersProps, LocationMarker(), MapPicker() (+11 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - ".getUserById"
Cohesion: 0.14
Nodes (11): GET, GET, POST, GET, PUT, GlobalCreateEventPage(), EditOrganizationPage(), SettingsPage() (+3 more)

### Community 16 - "tag.ts"
Cohesion: 0.12
Nodes (13): UseWebNfcOptions, NDEFMessage, NDEFReader, NDEFReadingEvent, NDEFRecord, NFCReaderOptions, NFCScanResult, NFCWriteResult (+5 more)

### Community 17 - "use-event-attendance-channel.ts"
Cohesion: 0.14
Nodes (12): @supabase/ssr, activeEventChannels, AttendanceRealtimeEvent, ChannelEntry, EventCallback, RealtimeConnectionStatus, StatusCallback, authRoutes (+4 more)

### Community 18 - "datetime-picker.tsx"
Cohesion: 0.24
Nodes (11): date-fns, @radix-ui/react-icons, @radix-ui/react-popover, @radix-ui/react-scroll-area, DateTimePicker(), DateTimePickerProps, Popover(), PopoverContent() (+3 more)

### Community 19 - "OrganizationWithRole"
Cohesion: 0.24
Nodes (10): CreateEventFormProps, EditOrganizationFormProps, OrganizationContentProps, OrganizationEmptyState(), OrganizationList(), OrganizationListProps, OrganizationMainView(), OrganizationMainViewProps (+2 more)

### Community 20 - "migrate.js"
Cohesion: 0.18
Nodes (6): pg, fs, path, { Pool }, path, { Pool }

### Community 21 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/leaflet, @types/node (+3 more)

### Community 22 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), ThemeProvider()

### Community 23 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, db:migrate, db:test, dev, lint, start

### Community 24 - ".eslintrc.json"
Cohesion: 0.40
Nodes (4): extends, rules, @next/next/no-img-element, next/core-web-vitals

### Community 25 - "calendar.tsx"
Cohesion: 0.60
Nodes (4): react-day-picker, buttonVariants, Calendar(), CalendarDayButton()

### Community 26 - "use-infinite-scroll.ts"
Cohesion: 0.40
Nodes (3): PaginationInfo, UseInfiniteScrollOptions, UseInfiniteScrollReturn

## Knowledge Gaps
- **20 isolated node(s):** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dayjs`, `dotenv`, `eslint` (+15 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 233 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `cn`, `MembershipService`, `OrganizationService`, `attendance.ts`, `UserService`, `EventService`, `package.json`, `createClient`, `map-picker.tsx`, `.getUserById`, `use-event-attendance-channel.ts`, `OrganizationWithRole`, `app/layout.tsx`?**
  _High betweenness centrality (0.272) - this node is a cross-community bridge._
- **What connects `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dayjs` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.060044150110375276 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `cn`, `auth-store.ts`, `attendance.ts`, `package.json`, `map-picker.tsx`, `tag.ts`, `use-event-attendance-channel.ts`, `datetime-picker.tsx`, `OrganizationWithRole`, `app/layout.tsx`, `calendar.tsx`, `use-infinite-scroll.ts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05004170141784821 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `Button`, `MembershipService`, `OrganizationService`, `attendance.ts`, `EventService`, `next`, `.getUserById`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `MembershipService` be split into smaller, more focused modules?**
  _Cohesion score 0.09433962264150944 - nodes in this community are weakly interconnected._