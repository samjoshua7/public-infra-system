# Architecture Guide

This document explains the software architecture for the Public Infrastructure Reporting and Tracking System. It is intended to guide implementation and future maintenance without introducing a different stack.

## 1. Application Architecture

The application is a React single-page application built with Vite and Material UI, hosted on Vercel. It uses Supabase for authentication, PostgreSQL storage, file storage (report photos), and Row Level Security. A small standalone Express server handles the one task Supabase/the browser cannot do safely: calling the AI vision API to auto-generate a title, description, and category from a submitted photo.

The architecture is intentionally two-tier:

- the browser renders the UI and talks to Supabase directly for auth, data, and storage,
- the browser talks to the Express server only for the AI auto-fill step,
- database triggers and RLS enforce report/status safety and access rules.

No custom backend is used for anything other than the AI call. Supabase remains the source of truth for all application data.

## 2. Architectural Principles

- Keep the database authoritative for report data and status.
- Keep the Express service minimal and single-purpose (AI auto-fill only).
- Keep feature logic close to the feature module.
- Use shared components only for truly reusable UI patterns.
- Treat authentication and authorization (role-based) as first-class concerns.

## 3. Folder Structure

```text
src/
  app/
    App.jsx
    providers/
    theme/
  lib/
    supabaseClient.js
    aiClient.js          # calls the Express AI auto-fill endpoint
    constants.js
  routes/
    index.jsx
    guards/
  features/
    auth/
    feed/                # public feed: view/like/comment
    reportSubmission/     # photo capture, geolocation, AI auto-fill review, submit
    reportDetail/
    officialDashboard/    # government official: detail + status pipeline
    admin/                # user/role management, moderation
  components/
    layout/
    cards/
    forms/
    feedback/
  hooks/
    useAuth.js
    usePermissions.js
    useGeolocation.js

server/                   # Express app — AI auto-fill service only
  routes/
    analyzeReport.js
  lib/
    aiProviderClient.js
  index.js
```

## 4. Feature Architecture

Each frontend feature should follow the same internal structure:

```text
features/<feature>/
  api.js
  page.jsx
  components/
  hooks/ (only if needed)
  utils/ (only if needed)
```

This keeps data-access logic, presentation, and feature-specific helpers in one place.

## 5. Component Architecture

The UI should be composed from small, purpose-driven components.

### Layout hierarchy

```text
AppShell
  ├─ AppHeader
  ├─ BottomNav / SidebarNavigation
  └─ MainContent
       ├─ PageHeader
       ├─ FeaturePage
       │    ├─ FeedList (ReportCard)
       │    ├─ ReportDetailView
       │    ├─ ReportSubmissionFlow (Capture -> AutoFillReview -> Submit)
       │    └─ StatusPipelineControl (official/admin only)
       └─ Feedback / Empty / Error states
```

Shared UI should live in the top-level components folder. Feature-specific presentation should remain inside the feature module.

## 6. Authentication Flow

1. The user signs in through Supabase Auth.
2. The application loads the authenticated session from the browser client.
3. The app resolves the user role (CITIZEN, GOVERNMENT_OFFICIAL, ADMIN) from application metadata/JWT claims.
4. Route guards enforce whether the user may view or act on a feature (e.g. only officials/admins reach the status pipeline controls).
5. Database RLS enforces the final authorization boundary.

The frontend should never assume that UI visibility alone is sufficient protection. RLS remains mandatory.

## 7. Routing

Routes should be organized by role and feature.

Suggested routing structure:

- /login
- /feed
- /report/new
- /report/:id
- /dashboard (government official — status pipeline view)
- /admin (admin — users, roles, moderation)

Protected routes should use route-level guards that verify the session and role before rendering the feature page.

## 8. API Layer

### Supabase feature API modules

Each feature's api.js should own Supabase queries and mutations:

- list/create/update operations for reports, comments, likes,
- status updates (restricted to official/admin, enforced in RLS),
- storage upload for report photos.

### Express AI endpoint

A single client module (src/lib/aiClient.js) should call the Express server's one endpoint (e.g. POST /api/analyze-report) with the photo (or its storage reference), and receive back a suggested title, description, and category for the citizen to review before submitting.

The Express layer should not contain report business logic beyond calling the AI provider and shaping its response — report persistence still happens through Supabase from the frontend once the citizen confirms the fields.

## 9. React Hooks

Reusable hooks should stay small and focused. Suggested hooks:

- useAuth for session and role state,
- usePermissions for role-based UI gates,
- useGeolocation for capturing device GPS at submission time, with permission-denied handling,
- useAsyncList for loading and error states.

Do not introduce a global state library for this project.

## 10. Reusable Components

Reusable components should be generic enough to be used by multiple features. Examples:

- ReportCard (feed item: photo, title, status chip, like/comment counts)
- StatusChip (posted / action_taken / fixed)
- ConfirmDialog
- EmptyState
- ErrorAlert
- PageHeader
- PhotoCaptureField
- MapPreview (renders the captured coordinates)

Feature-specific UI should remain within the feature module.

## 11. State Management

The application should use a combination of:

- React local state for form, dialog, and report-submission-flow state,
- context for shared user/session/role state,
- server state from Supabase for reports, comments, likes, and status history.

No Redux or other external state library is required.

## 12. Supabase Interaction

Supabase access should be centralized in a shared client module:

```text
src/lib/supabaseClient.js
```

This module should expose the initialized client and any reusable helper functions. Feature modules call it rather than constructing their own clients.

## 13. Error Handling

The UI should distinguish between:

- network errors,
- authentication errors,
- authorization errors,
- geolocation permission errors,
- AI auto-fill failures (should degrade to manual entry, not block submission),
- validation errors.

Each feature should provide clear empty, loading, and error states.

## 14. Loading Strategy

The initial experience should remain responsive. The application should render shell UI quickly and load data progressively.

Recommended approach:

- show skeletons or simple placeholders on initial feed load,
- show a distinct "analyzing photo" loading state during the AI auto-fill call,
- display empty states when no reports exist,
- keep the feed lightweight and paginated,
- avoid loading full-resolution photos in the list view.

## 15. Caching

Caching should stay minimal.

Recommended defaults:

- rely on Supabase query results for current feed/report data,
- use React state for transient UI state (submission flow, dialogs),
- avoid caching AI auto-fill results beyond the current submission session.

## 16. Pagination and Large Lists

The public feed and the official dashboard should use server-side filtering and pagination (e.g. by status, by area, by date) rather than loading all reports at once.

## 17. Photo Capture and Geolocation

- Photo capture uses the device camera/file input in the browser.
- Geolocation is captured via the browser Geolocation API at the moment of submission — not derived from photo EXIF data.
- If geolocation permission is denied, block submission with a clear message; do not post a report without coordinates.
- The captured photo is uploaded to Supabase Storage; the Express AI endpoint receives either the raw photo or a reference to the uploaded object.

## 18. Data Flow Diagrams

### Report submission flow

```text
Citizen -> Capture Photo + Geolocation -> Upload to Supabase Storage
                                        -> Express AI endpoint (title/description/category)
                                        -> Citizen reviews/edits AI suggestion
                                        -> Feature API -> Supabase -> PostgreSQL (issue_reports)
                                        -> Feed refreshes
```

### Status update flow (official/admin)

```text
Official/Admin -> Status control -> Feature API -> Supabase -> PostgreSQL
                                                  -> Trigger records report_status_history row
                                                  -> Report detail + feed status chip refresh
```

### Like/comment flow

```text
User -> Like or Comment action -> Feature API -> Supabase -> PostgreSQL
                                                -> Trigger updates like_count/comment_count cache
                                                -> UI refreshes counts
```

## 19. Module Dependency Diagram

```text
AppShell
  -> AuthProvider
  -> Router
  -> Feature Pages
       -> Feature API modules (Supabase)
       -> aiClient (Express, submission flow only)
       -> Shared UI components
       -> Shared hooks
       -> Supabase client
```

## 20. Future Scalability

The current architecture fits a single-region civic reporting rollout. As usage grows, the project can evolve by adding:

- a map-based feed view with clustering,
- push/email notifications on status change,
- richer analytics/reporting views over stabilized report data,
- a queue for AI auto-fill calls if photo volume grows beyond simple request/response latency.

That growth should be handled incrementally rather than by introducing a different architecture upfront.
