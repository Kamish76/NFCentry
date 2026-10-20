# Graph Report - NFCentry redo  (2026-10-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 955 nodes · 2937 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `71481c7d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- query
- OrganizationService
- MembershipService
- createClient
- sidebar.tsx
- UserService
- next
- dependencies
- attendance.ts
- auth-store.ts
- EventService
- package.json
- organization-settings.tsx
- tag.ts
- NeonQueryBuilder
- datetime-picker.tsx
- components.json
- compilerOptions
- cn
- sheet.tsx
- map-picker.tsx
- migrate.js
- breadcrumb.tsx
- devDependencies
- map-preview.tsx
- scripts
- test-oauth-flow.js
- app/layout.tsx
- .eslintrc.json
- .confirmTag
- use-infinite-scroll.ts
- GEMINI.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 151 edges
2. `cn()` - 105 edges
3. `next` - 102 edges
4. `Button()` - 75 edges
5. `react` - 60 edges
6. `Card()` - 58 edges
7. `CardContent()` - 54 edges
8. `UserService` - 49 edges
9. `CardHeader()` - 46 edges
10. `CardTitle()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `UseUserProfileReturn` --references--> `User`  [EXTRACTED]
  src/hooks/use-user-profile.ts → src/types/user.ts
- `AuthActions` --references--> `User`  [EXTRACTED]
  src/types/auth.ts → src/types/user.ts
- `AuthState` --references--> `User`  [EXTRACTED]
  src/types/auth.ts → src/types/user.ts
- `MapPreview()` --calls--> `Button()`  [EXTRACTED]
  src/components/events/map-preview.tsx → src/components/ui/button.tsx
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (101): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+93 more)

### Community 1 - "query"
Cohesion: 0.09
Nodes (35): POST(), failRedirect(), GET(), GET(), GET(), POST(), POST(), createSignedOAuthState() (+27 more)

### Community 2 - "OrganizationService"
Cohesion: 0.10
Nodes (34): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+26 more)

### Community 3 - "MembershipService"
Cohesion: 0.10
Nodes (26): DELETE, GET, PATCH, GET, GET, POST, POST, GET (+18 more)

### Community 4 - "createClient"
Cohesion: 0.06
Nodes (32): GET, POST, DELETE, PATCH, ALLOWED_MIME_TYPES, DELETE, GET, POST (+24 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (36): @radix-ui/react-separator, @radix-ui/react-tooltip, AuthenticatedLayout(), AppSidebar(), navigationItems, Separator(), SidebarContent(), SidebarContext (+28 more)

### Community 6 - "UserService"
Cohesion: 0.07
Nodes (21): GET, GET, POST(), POST, POST, PUT, GET, GET (+13 more)

### Community 7 - "next"
Cohesion: 0.16
Nodes (9): nextConfig, next, GET, dynamic, AuthenticatedContext, AuthenticatedHandler, AuthUser, withAuth() (+1 more)

### Community 8 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, cmdk, date-fns, dayjs (+30 more)

### Community 9 - "attendance.ts"
Cohesion: 0.10
Nodes (23): xlsx, GET, GET, POST, ScannedUser, GeolocationCoords, useGeolocation(), ScanMethod (+15 more)

### Community 10 - "auth-store.ts"
Cohesion: 0.11
Nodes (30): zustand, DashboardEvent, DashboardPage(), EventStatus, formatDateKey(), formatEventDate(), getGreeting(), useEventList() (+22 more)

### Community 11 - "EventService"
Cohesion: 0.14
Nodes (18): DELETE, GET, PUT, GET, POST, GET, EditEventFormProps, EventPreview (+10 more)

### Community 12 - "package.json"
Cohesion: 0.06
Nodes (31): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, clsx, cmdk, dayjs (+23 more)

### Community 13 - "organization-settings.tsx"
Cohesion: 0.15
Nodes (23): class-variance-authority, SettingsPage(), SettingsPageProps, OrganizationSettings(), Badge(), badgeVariants, CommandDialog(), Dialog() (+15 more)

### Community 14 - "tag.ts"
Cohesion: 0.08
Nodes (22): RequestsViewProps, UseWebNfcOptions, Database, Json, CreateJoinRequestInput, JoinRequest, JoinRequestStatus, JoinRequestWithOrganization (+14 more)

### Community 16 - "datetime-picker.tsx"
Cohesion: 0.17
Nodes (15): date-fns, @radix-ui/react-icons, @radix-ui/react-popover, @radix-ui/react-scroll-area, react-day-picker, buttonVariants, Calendar(), CalendarDayButton() (+7 more)

### Community 17 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 18 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "cn"
Cohesion: 0.18
Nodes (14): CardAction(), CardFooter(), Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+6 more)

### Community 20 - "sheet.tsx"
Cohesion: 0.23
Nodes (10): @radix-ui/react-dialog, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal() (+2 more)

### Community 21 - "map-picker.tsx"
Cohesion: 0.26
Nodes (11): currentMarkerIcon, historicalMarkerIcon, HistoricalMarkers(), HistoricalMarkersProps, LocationMarker(), MapPicker(), MapPickerProps, MapUpdater() (+3 more)

### Community 22 - "migrate.js"
Cohesion: 0.18
Nodes (6): pg, fs, path, { Pool }, path, { Pool }

### Community 23 - "breadcrumb.tsx"
Cohesion: 0.35
Nodes (10): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator() (+2 more)

### Community 24 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/leaflet, @types/node (+3 more)

### Community 25 - "map-preview.tsx"
Cohesion: 0.24
Nodes (8): leaflet, react-leaflet, eventMarkerIcon, MapPreview(), MapPreviewProps, MapPreview, MapPreviewWrapper(), MapPreviewWrapperProps

### Community 26 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, db:migrate, db:test, dev, lint, start, test:oauth (+1 more)

### Community 27 - "test-oauth-flow.js"
Cohesion: 0.28
Nodes (6): assert, buildGoogleAuthRedirect(), cookieData, res, assert, sanitizeNext()

### Community 28 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), ThemeProvider()

### Community 29 - ".eslintrc.json"
Cohesion: 0.40
Nodes (4): extends, rules, @next/next/no-img-element, next/core-web-vitals

### Community 30 - ".confirmTag"
Cohesion: 0.40
Nodes (3): POST, POST, GenerateTagResponse

### Community 31 - "use-infinite-scroll.ts"
Cohesion: 0.40
Nodes (3): PaginationInfo, UseInfiniteScrollOptions, UseInfiniteScrollReturn

## Knowledge Gaps
- **22 isolated node(s):** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dayjs`, `dotenv`, `eslint` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 266 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `query`, `OrganizationService`, `MembershipService`, `createClient`, `sidebar.tsx`, `UserService`, `[id]/page.tsx`, `attendance.ts`, `auth-store.ts`, `EventService`, `package.json`, `organization-settings.tsx`, `breadcrumb.tsx`, `map-preview.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.308) - this node is a cross-community bridge._
- **What connects `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dayjs` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.05593663236975339 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `Button`, `query`, `OrganizationService`, `MembershipService`, `UserService`, `next`, `attendance.ts`, `EventService`, `organization-settings.tsx`, `.confirmTag`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Should `query` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `MembershipService`, `sidebar.tsx`, `attendance.ts`, `auth-store.ts`, `package.json`, `organization-settings.tsx`, `tag.ts`, `datetime-picker.tsx`, `cn`, `sheet.tsx`, `map-picker.tsx`, `breadcrumb.tsx`, `map-preview.tsx`, `app/layout.tsx`, `use-infinite-scroll.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `OrganizationService` be split into smaller, more focused modules?**
  _Cohesion score 0.1012987012987013 - nodes in this community are weakly interconnected._