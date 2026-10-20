# Graph Report - NFCentry redo  (2026-10-20)

## Corpus Check
- 189 files · ~91,616 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 934 nodes · 2895 edges · 29 communities (26 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8874faf7`
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
- utils.ts
- tag.ts
- NeonQueryBuilder
- datetime-picker.tsx
- GEMINI.md
- migrate.js
- devDependencies
- app/layout.tsx
- scripts
- .eslintrc.json
- calendar.tsx
- use-infinite-scroll.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 151 edges
2. `cn()` - 105 edges
3. `next` - 100 edges
4. `Button()` - 75 edges
5. `react` - 60 edges
6. `Card()` - 58 edges
7. `CardContent()` - 54 edges
8. `UserService` - 49 edges
9. `CardHeader()` - 46 edges
10. `CardTitle()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `POST` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/approve/route.ts → src/lib/neon/server.ts
- `GET` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/organization/[organizationId]/requests/route.ts → src/lib/neon/server.ts
- `POST` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/membership/reject/route.ts → src/lib/neon/server.ts
- `GET` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/user/memberships/route.ts → src/lib/neon/server.ts
- `GET` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/user/search/route.ts → src/lib/neon/server.ts

## Import Cycles
- None detected.

## Communities (29 total, 3 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (93): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+85 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (89): cmdk, @radix-ui/react-separator, @radix-ui/react-slot, AuthenticatedLayout(), AppSidebar(), navigationItems, OrganizationSettings(), Badge() (+81 more)

### Community 2 - "MembershipService"
Cohesion: 0.10
Nodes (24): DELETE, GET, PATCH, GET, GET, POST, POST, GET (+16 more)

### Community 3 - "auth-store.ts"
Cohesion: 0.14
Nodes (24): zustand, useAuth(), UseProfileStatusReturn, useUserProfile(), UseUserProfileReturn, initialState, useAuthError(), useAuthLoading() (+16 more)

### Community 4 - "OrganizationService"
Cohesion: 0.09
Nodes (38): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+30 more)

### Community 5 - "attendance.ts"
Cohesion: 0.09
Nodes (24): xlsx, GET, GET, DELETE, PATCH, GET, POST, ScannedUser (+16 more)

### Community 6 - "UserService"
Cohesion: 0.09
Nodes (17): GET, POST(), POST, PUT, GET, GET, POST, GET (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, cmdk, date-fns, dayjs (+30 more)

### Community 8 - "EventService"
Cohesion: 0.14
Nodes (18): DELETE, GET, PUT, GET, POST, GET, EditEventFormProps, EventPreview (+10 more)

### Community 9 - "next"
Cohesion: 0.10
Nodes (16): nextConfig, next, POST, GET, POST, GET, GET, POST (+8 more)

### Community 10 - "package.json"
Cohesion: 0.06
Nodes (33): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, dayjs (+25 more)

### Community 11 - "createClient"
Cohesion: 0.09
Nodes (24): GET, POST, ALLOWED_MIME_TYPES, DELETE, GET, POST, POST, GET (+16 more)

### Community 12 - "map-picker.tsx"
Cohesion: 0.16
Nodes (16): leaflet, react-leaflet, currentMarkerIcon, historicalMarkerIcon, HistoricalMarkers(), HistoricalMarkersProps, LocationMarker(), MapPicker() (+8 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "utils.ts"
Cohesion: 0.11
Nodes (24): DashboardEvent, DashboardPage(), EventStatus, formatDateKey(), formatEventDate(), getGreeting(), useEventList(), OrganizationEventsPage() (+16 more)

### Community 16 - "tag.ts"
Cohesion: 0.08
Nodes (22): RequestsViewProps, UseWebNfcOptions, Database, Json, CreateJoinRequestInput, JoinRequest, JoinRequestStatus, JoinRequestWithOrganization (+14 more)

### Community 17 - "NeonQueryBuilder"
Cohesion: 0.06
Nodes (27): POST(), GET(), GET(), POST(), POST(), hashPassword(), verifyPassword(), base64UrlToBytes() (+19 more)

### Community 18 - "datetime-picker.tsx"
Cohesion: 0.24
Nodes (11): date-fns, @radix-ui/react-icons, @radix-ui/react-popover, @radix-ui/react-scroll-area, DateTimePicker(), DateTimePickerProps, Popover(), PopoverContent() (+3 more)

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
- **22 isolated node(s):** `next/core-web-vitals`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@neondatabase/serverless`, `@radix-ui/react-dropdown-menu` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 261 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `cn`, `MembershipService`, `OrganizationService`, `attendance.ts`, `UserService`, `EventService`, `package.json`, `createClient`, `utils.ts`, `NeonQueryBuilder`, `app/layout.tsx`?**
  _High betweenness centrality (0.301) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06053639846743295 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `Button`, `MembershipService`, `auth-store.ts`, `OrganizationService`, `attendance.ts`, `UserService`, `EventService`, `next`, `utils.ts`, `NeonQueryBuilder`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05045871559633028 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `cn`, `auth-store.ts`, `OrganizationService`, `package.json`, `map-picker.tsx`, `utils.ts`, `tag.ts`, `datetime-picker.tsx`, `app/layout.tsx`, `calendar.tsx`, `use-infinite-scroll.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `MembershipService` be split into smaller, more focused modules?**
  _Cohesion score 0.0988235294117647 - nodes in this community are weakly interconnected._