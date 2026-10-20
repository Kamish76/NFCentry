# Graph Report - NFCentry redo  (2026-10-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 951 nodes · 2934 edges · 43 communities (34 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e0216915`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- NeonQueryBuilder
- OrganizationService
- MembershipService
- dependencies
- next
- attendance.ts
- EventService
- auth-store.ts
- package.json
- createClient
- sidebar.tsx
- tag.ts
- organization-settings.tsx
- User
- map-picker.tsx
- .getUserById
- components.json
- compilerOptions
- cn
- datetime-picker.tsx
- sheet.tsx
- migrate.js
- breadcrumb.tsx
- devDependencies
- app-sidebar.tsx
- scripts
- test-oauth-flow.js
- app/layout.tsx
- .eslintrc.json
- calendar.tsx
- .confirmTag
- use-infinite-scroll.ts
- badge.tsx
- export/route.ts
- .canWriteTag
- .getTagWriteHistory
- .prepareTag
- GEMINI.md
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 151 edges
2. `cn()` - 105 edges
3. `next` - 101 edges
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
- `SidebarGroupAction()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/sidebar.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (43 total, 9 thin omitted)

### Community 0 - "Button"
Cohesion: 0.05
Nodes (108): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+100 more)

### Community 1 - "NeonQueryBuilder"
Cohesion: 0.06
Nodes (32): POST(), failRedirect(), GET(), GET(), GET(), POST(), POST(), OAUTH_STATE_COOKIE_NAME (+24 more)

### Community 2 - "OrganizationService"
Cohesion: 0.11
Nodes (30): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+22 more)

### Community 3 - "MembershipService"
Cohesion: 0.09
Nodes (25): DELETE, GET, PATCH, GET, POST, POST, GET, GET (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, cmdk, date-fns, dayjs (+30 more)

### Community 5 - "next"
Cohesion: 0.19
Nodes (7): next, POST, AuthenticatedContext, AuthenticatedHandler, AuthUser, withAuth(), UserService

### Community 6 - "attendance.ts"
Cohesion: 0.10
Nodes (23): xlsx, GET, GET, POST, ScannedUser, GeolocationCoords, useGeolocation(), ScanMethod (+15 more)

### Community 7 - "EventService"
Cohesion: 0.12
Nodes (18): DELETE, GET, PUT, GET, POST, GET, EditEventFormProps, EventPreview (+10 more)

### Community 8 - "auth-store.ts"
Cohesion: 0.12
Nodes (28): DashboardEvent, DashboardPage(), EventStatus, formatDateKey(), formatEventDate(), getGreeting(), useEventList(), useAuth() (+20 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (32): name, private, version, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, clsx, cmdk, dayjs (+24 more)

### Community 10 - "createClient"
Cohesion: 0.09
Nodes (20): GET, POST, DELETE, PATCH, POST, GET, POST, GET (+12 more)

### Community 11 - "sidebar.tsx"
Cohesion: 0.12
Nodes (26): @radix-ui/react-separator, @radix-ui/react-tooltip, AuthenticatedLayout(), Separator(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarInput() (+18 more)

### Community 12 - "tag.ts"
Cohesion: 0.08
Nodes (22): RequestsViewProps, UseWebNfcOptions, Database, Json, CreateJoinRequestInput, JoinRequest, JoinRequestStatus, JoinRequestWithOrganization (+14 more)

### Community 13 - "organization-settings.tsx"
Cohesion: 0.18
Nodes (20): SettingsPage(), SettingsPageProps, OrganizationSettings(), CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+12 more)

### Community 14 - "User"
Cohesion: 0.11
Nodes (12): GET, GET, POST(), POST, PUT, AuthProvider, AuthProviderInfo, CreateUserInput (+4 more)

### Community 15 - "map-picker.tsx"
Cohesion: 0.13
Nodes (19): leaflet, react-leaflet, currentMarkerIcon, historicalMarkerIcon, HistoricalMarkers(), HistoricalMarkersProps, LocationMarker(), MapPicker() (+11 more)

### Community 16 - ".getUserById"
Cohesion: 0.12
Nodes (14): ALLOWED_MIME_TYPES, DELETE, GET, POST, POST, GET, POST, GET (+6 more)

### Community 17 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 18 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "cn"
Cohesion: 0.18
Nodes (14): CardAction(), CardFooter(), Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+6 more)

### Community 20 - "datetime-picker.tsx"
Cohesion: 0.24
Nodes (11): date-fns, @radix-ui/react-icons, @radix-ui/react-popover, @radix-ui/react-scroll-area, DateTimePicker(), DateTimePickerProps, Popover(), PopoverContent() (+3 more)

### Community 21 - "sheet.tsx"
Cohesion: 0.23
Nodes (10): @radix-ui/react-dialog, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal() (+2 more)

### Community 22 - "migrate.js"
Cohesion: 0.18
Nodes (6): pg, fs, path, { Pool }, path, { Pool }

### Community 23 - "breadcrumb.tsx"
Cohesion: 0.35
Nodes (10): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator() (+2 more)

### Community 24 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/leaflet, @types/node (+3 more)

### Community 25 - "app-sidebar.tsx"
Cohesion: 0.33
Nodes (10): AppSidebar(), navigationItems, SidebarContent(), SidebarFooter(), SidebarGroup(), SidebarGroupContent(), SidebarGroupLabel(), SidebarHeader() (+2 more)

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

### Community 30 - "calendar.tsx"
Cohesion: 0.60
Nodes (4): react-day-picker, buttonVariants, Calendar(), CalendarDayButton()

### Community 31 - ".confirmTag"
Cohesion: 0.40
Nodes (3): POST, POST, GenerateTagResponse

### Community 32 - "use-infinite-scroll.ts"
Cohesion: 0.40
Nodes (3): PaginationInfo, UseInfiniteScrollOptions, UseInfiniteScrollReturn

### Community 33 - "badge.tsx"
Cohesion: 0.67
Nodes (3): class-variance-authority, Badge(), badgeVariants

## Knowledge Gaps
- **22 isolated node(s):** `next/core-web-vitals`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dayjs`, `dotenv` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 266 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `NeonQueryBuilder`, `OrganizationService`, `MembershipService`, `attendance.ts`, `EventService`, `auth-store.ts`, `package.json`, `createClient`, `sidebar.tsx`, `organization-settings.tsx`, `map-picker.tsx`, `.getUserById`, `breadcrumb.tsx`, `app-sidebar.tsx`, `app/layout.tsx`, `export/route.ts`, `next.config.ts`, `[id]/page.tsx`?**
  _High betweenness centrality (0.302) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.05306725794530673 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `Button`, `NeonQueryBuilder`, `export/route.ts`, `OrganizationService`, `MembershipService`, `next`, `attendance.ts`, `EventService`, `.canWriteTag`, `.getTagWriteHistory`, `.prepareTag`, `organization-settings.tsx`, `User`, `.getUserById`, `.confirmTag`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Should `NeonQueryBuilder` be split into smaller, more focused modules?**
  _Cohesion score 0.05844155844155844 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `use-infinite-scroll.ts`, `badge.tsx`, `attendance.ts`, `auth-store.ts`, `package.json`, `sidebar.tsx`, `tag.ts`, `organization-settings.tsx`, `map-picker.tsx`, `cn`, `datetime-picker.tsx`, `sheet.tsx`, `breadcrumb.tsx`, `app-sidebar.tsx`, `app/layout.tsx`, `calendar.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `OrganizationService` be split into smaller, more focused modules?**
  _Cohesion score 0.11450980392156863 - nodes in this community are weakly interconnected._