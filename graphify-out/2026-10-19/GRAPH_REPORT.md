# Graph Report - NFCentry redo  (2026-10-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 829 nodes · 2695 edges · 27 communities (23 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Button
- cn
- OrganizationService
- UserService
- MembershipService
- createClient
- edit-event-form.tsx
- attendance.ts
- auth-store.ts
- EventService
- dependencies
- package.json
- components.json
- compilerOptions
- tag.ts
- datetime-picker.tsx
- devDependencies
- map-preview.tsx
- app/layout.tsx
- .getUserById
- scripts
- calendar.tsx
- attendance/[id]/route.ts
- use-infinite-scroll.ts
- .eslintrc.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 145 edges
2. `cn()` - 105 edges
3. `next` - 93 edges
4. `Button()` - 75 edges
5. `react` - 59 edges
6. `Card()` - 58 edges
7. `CardContent()` - 54 edges
8. `UserService` - 49 edges
9. `CardHeader()` - 46 edges
10. `CardTitle()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `EventsListViewProps` --references--> `MembershipRole`  [EXTRACTED]
  src/components/events/events-list-view.tsx → src/types/membership.ts
- `AuthState` --references--> `User`  [EXTRACTED]
  src/types/auth.ts → src/types/user.ts
- `EditEventFormProps` --references--> `Event`  [EXTRACTED]
  src/components/events/edit-event-form.tsx → src/types/event.ts
- `MapPreview()` --calls--> `Button()`  [EXTRACTED]
  src/components/events/map-preview.tsx → src/components/ui/button.tsx
- `middleware()` --calls--> `updateSession()`  [EXTRACTED]
  middleware.ts → src/lib/supabase/middleware.ts

## Import Cycles
- None detected.

## Communities (27 total, 4 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (91): lucide-react, react, AuthErrorPage(), ForgotPasswordPage(), LoginPage(), SignUpPage(), SignUpSuccessPage(), UpdatePasswordPage() (+83 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (85): @radix-ui/react-dialog, @radix-ui/react-separator, @radix-ui/react-slot, AuthenticatedLayout(), AppSidebar(), navigationItems, OrganizationSettings(), Badge() (+77 more)

### Community 2 - "OrganizationService"
Cohesion: 0.08
Nodes (43): GET, GET, POST, DELETE, GET, PATCH, DELETE, GET (+35 more)

### Community 3 - "UserService"
Cohesion: 0.07
Nodes (27): GET, GET, POST(), POST, POST, GET, PUT, GET (+19 more)

### Community 4 - "MembershipService"
Cohesion: 0.10
Nodes (25): DELETE, GET, PATCH, GET, GET, POST, POST, GET (+17 more)

### Community 5 - "createClient"
Cohesion: 0.09
Nodes (22): nextConfig, next, @supabase/supabase-js, GET, POST, POST, GET, POST (+14 more)

### Community 6 - "edit-event-form.tsx"
Cohesion: 0.09
Nodes (31): config, middleware(), @supabase/ssr, EditEventPage(), EditEventForm(), EditEventFormProps, MapPicker, LocationAutocomplete() (+23 more)

### Community 7 - "attendance.ts"
Cohesion: 0.10
Nodes (25): xlsx, GET, GET, GET, POST, ScannedUser, GeolocationCoords, useGeolocation() (+17 more)

### Community 8 - "auth-store.ts"
Cohesion: 0.10
Nodes (30): RequestsViewProps, useAuth(), UseProfileStatusReturn, useUserProfile(), initialState, useAuthError(), useAuthLoading(), useAuthStore (+22 more)

### Community 9 - "EventService"
Cohesion: 0.15
Nodes (17): DELETE, GET, PUT, GET, POST, GET, EventPreview, EventService (+9 more)

### Community 10 - "dependencies"
Cohesion: 0.06
Nodes (32): dependencies, class-variance-authority, clsx, cmdk, date-fns, dayjs, html5-qrcode, leaflet (+24 more)

### Community 11 - "package.json"
Cohesion: 0.07
Nodes (27): name, private, version, class-variance-authority, clsx, cmdk, dayjs, eslint (+19 more)

### Community 12 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "tag.ts"
Cohesion: 0.12
Nodes (13): UseWebNfcOptions, NDEFMessage, NDEFReader, NDEFReadingEvent, NDEFRecord, NFCReaderOptions, NFCScanResult, NFCWriteResult (+5 more)

### Community 15 - "datetime-picker.tsx"
Cohesion: 0.24
Nodes (11): date-fns, @radix-ui/react-icons, @radix-ui/react-popover, @radix-ui/react-scroll-area, DateTimePicker(), DateTimePickerProps, Popover(), PopoverContent() (+3 more)

### Community 16 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/leaflet, @types/node (+3 more)

### Community 17 - "map-preview.tsx"
Cohesion: 0.24
Nodes (8): leaflet, react-leaflet, eventMarkerIcon, MapPreview(), MapPreviewProps, MapPreview, MapPreviewWrapper(), MapPreviewWrapperProps

### Community 18 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), ThemeProvider()

### Community 19 - ".getUserById"
Cohesion: 0.31
Nodes (6): ALLOWED_MIME_TYPES, DELETE, GET, POST, GET, POST

### Community 20 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 21 - "calendar.tsx"
Cohesion: 0.60
Nodes (4): react-day-picker, buttonVariants, Calendar(), CalendarDayButton()

### Community 23 - "use-infinite-scroll.ts"
Cohesion: 0.40
Nodes (3): PaginationInfo, UseInfiniteScrollOptions, UseInfiniteScrollReturn

## Knowledge Gaps
- **15 isolated node(s):** `dayjs`, `eslint`, `eslint-config-next`, `@radix-ui/react-dropdown-menu`, `react-dom` (+10 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 203 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `createClient` to `Button`, `cn`, `OrganizationService`, `UserService`, `MembershipService`, `edit-event-form.tsx`, `attendance.ts`, `EventService`, `package.json`, `map-preview.tsx`, `app/layout.tsx`, `.getUserById`, `attendance/[id]/route.ts`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **What connects `dayjs`, `eslint`, `eslint-config-next` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06197327852004111 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `Button`, `OrganizationService`, `UserService`, `MembershipService`, `edit-event-form.tsx`, `attendance.ts`, `EventService`, `.getUserById`, `attendance/[id]/route.ts`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05265123226288275 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `cn`, `OrganizationService`, `MembershipService`, `edit-event-form.tsx`, `attendance.ts`, `auth-store.ts`, `package.json`, `tag.ts`, `datetime-picker.tsx`, `map-preview.tsx`, `app/layout.tsx`, `calendar.tsx`, `use-infinite-scroll.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `OrganizationService` be split into smaller, more focused modules?**
  _Cohesion score 0.07757885763000852 - nodes in this community are weakly interconnected._