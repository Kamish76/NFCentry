# Graph Report - NFCentry redo  (2026-10-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 840 nodes · 2669 edges · 33 communities (31 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Button
- utils.ts
- auth-store.ts
- MembershipService
- createClient
- attendance.ts
- sidebar.tsx
- UserService
- EventService
- dependencies
- OrganizationService
- next
- package.json
- organization-settings.tsx
- tag.ts
- organization.service.ts
- components.json
- compilerOptions
- cn
- datetime-picker.tsx
- sheet.tsx
- breadcrumb.tsx
- devDependencies
- app/layout.tsx
- supabase/middleware.ts
- join-request.ts
- .eslintrc.json
- scripts
- calendar.tsx
- use-infinite-scroll.ts
- badge.tsx
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
- `EventsListViewProps` --references--> `MembershipRole`  [EXTRACTED]
  src/components/events/events-list-view.tsx → src/types/membership.ts
- `MapPreview()` --calls--> `Button()`  [EXTRACTED]
  src/components/events/map-preview.tsx → src/components/ui/button.tsx
- `SelectLabel()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/select.tsx → src/lib/utils.ts
- `SelectSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/select.tsx → src/lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (33 total, 2 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (84): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+76 more)

### Community 1 - "utils.ts"
Cohesion: 0.06
Nodes (45): leaflet, react-leaflet, EventDetailPage(), OrganizationEventsPage(), AttendanceList(), AttendanceListProps, ConnectionStatus, EventCard() (+37 more)

### Community 2 - "auth-store.ts"
Cohesion: 0.08
Nodes (36): zustand, DashboardEvent, DashboardPage(), EventStatus, formatDateKey(), formatEventDate(), getGreeting(), useEventList() (+28 more)

### Community 3 - "MembershipService"
Cohesion: 0.11
Nodes (22): DELETE, GET, PATCH, GET, GET, POST, POST, GET (+14 more)

### Community 4 - "createClient"
Cohesion: 0.10
Nodes (24): @supabase/supabase-js, GET, POST, ALLOWED_MIME_TYPES, DELETE, GET, POST, GET (+16 more)

### Community 5 - "attendance.ts"
Cohesion: 0.08
Nodes (25): xlsx, GET, DELETE, PATCH, GET, POST, ScannedUser, GeolocationCoords (+17 more)

### Community 6 - "sidebar.tsx"
Cohesion: 0.10
Nodes (36): @radix-ui/react-separator, @radix-ui/react-tooltip, AuthenticatedLayout(), AppSidebar(), navigationItems, Separator(), SidebarContent(), SidebarContext (+28 more)

### Community 7 - "UserService"
Cohesion: 0.09
Nodes (15): GET, GET, POST(), POST, POST, PUT, GET, POST (+7 more)

### Community 8 - "EventService"
Cohesion: 0.12
Nodes (18): DELETE, GET, PUT, GET, POST, GET, EditEventFormProps, EventPreview (+10 more)

### Community 9 - "dependencies"
Cohesion: 0.06
Nodes (32): dependencies, class-variance-authority, clsx, cmdk, date-fns, dayjs, html5-qrcode, leaflet (+24 more)

### Community 10 - "OrganizationService"
Cohesion: 0.21
Nodes (16): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+8 more)

### Community 11 - "next"
Cohesion: 0.13
Nodes (14): nextConfig, next, GET, POST, GET, POST, POST, GET (+6 more)

### Community 12 - "package.json"
Cohesion: 0.08
Nodes (24): name, private, version, clsx, dayjs, eslint, eslint-config-next, html5-qrcode (+16 more)

### Community 13 - "organization-settings.tsx"
Cohesion: 0.19
Nodes (20): OrganizationSettings(), CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+12 more)

### Community 14 - "tag.ts"
Cohesion: 0.09
Nodes (17): GET, GET, UseWebNfcOptions, CanWriteTagResponse, NDEFMessage, NDEFReader, NDEFReadingEvent, NDEFRecord (+9 more)

### Community 15 - "organization.service.ts"
Cohesion: 0.14
Nodes (15): EditOrganizationPage(), EditOrganizationPageProps, SettingsPage(), SettingsPageProps, UserMembership, AuthorizationContext, AddMemberInput, CreateOrganizationInput (+7 more)

### Community 16 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 17 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "cn"
Cohesion: 0.20
Nodes (13): cmdk, CardAction(), CardFooter(), Command(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+5 more)

### Community 19 - "datetime-picker.tsx"
Cohesion: 0.26
Nodes (10): date-fns, @radix-ui/react-icons, @radix-ui/react-scroll-area, DateTimePicker(), DateTimePickerProps, Popover(), PopoverContent(), PopoverTrigger() (+2 more)

### Community 20 - "sheet.tsx"
Cohesion: 0.23
Nodes (10): @radix-ui/react-dialog, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal() (+2 more)

### Community 21 - "breadcrumb.tsx"
Cohesion: 0.35
Nodes (10): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator() (+2 more)

### Community 22 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/leaflet, @types/node (+3 more)

### Community 23 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), ThemeProvider()

### Community 24 - "supabase/middleware.ts"
Cohesion: 0.32
Nodes (6): @supabase/ssr, authRoutes, publicRoutes, updateSession(), config, middleware()

### Community 25 - "join-request.ts"
Cohesion: 0.32
Nodes (7): RequestsViewProps, CreateJoinRequestInput, JoinRequest, JoinRequestStatus, JoinRequestWithOrganization, JoinRequestWithUser, ReviewJoinRequestInput

### Community 26 - ".eslintrc.json"
Cohesion: 0.40
Nodes (4): extends, rules, @next/next/no-img-element, next/core-web-vitals

### Community 27 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 28 - "calendar.tsx"
Cohesion: 0.60
Nodes (4): react-day-picker, buttonVariants, Calendar(), CalendarDayButton()

### Community 29 - "use-infinite-scroll.ts"
Cohesion: 0.40
Nodes (3): PaginationInfo, UseInfiniteScrollOptions, UseInfiniteScrollReturn

### Community 30 - "badge.tsx"
Cohesion: 0.67
Nodes (3): class-variance-authority, Badge(), badgeVariants

## Knowledge Gaps
- **15 isolated node(s):** `dayjs`, `eslint`, `eslint-config-next`, `@radix-ui/react-dropdown-menu`, `react-dom` (+10 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `utils.ts`, `auth-store.ts`, `MembershipService`, `createClient`, `attendance.ts`, `sidebar.tsx`, `UserService`, `EventService`, `OrganizationService`, `package.json`, `organization-settings.tsx`, `organization.service.ts`, `breadcrumb.tsx`, `app/layout.tsx`, `supabase/middleware.ts`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **What connects `dayjs`, `eslint`, `eslint-config-next` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06789266712930835 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `utils.ts`, `auth-store.ts`, `attendance.ts`, `sidebar.tsx`, `package.json`, `organization-settings.tsx`, `tag.ts`, `cn`, `datetime-picker.tsx`, `sheet.tsx`, `breadcrumb.tsx`, `app/layout.tsx`, `calendar.tsx`, `use-infinite-scroll.ts`, `badge.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `utils.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06078316773816481 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `utils.ts`, `MembershipService`, `EventService`, `OrganizationService`, `next`, `organization.service.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `auth-store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._