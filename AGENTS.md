# Public Infrastructure Reporting and Tracking System — Development Constitution

This document is the implementation constitution for the repository. It defines the product intent, the technical guardrails, the delivery order, and the rules that future implementation work must follow.

## API Contract Rule

Before renaming, removing, or moving any exported function:

1. Search the entire project for every import of that function.
2. Update all dependent modules.
3. Run a production build.
4. Only consider the refactor complete if the build succeeds.

Never change a public API without updating all consumers.

## Human Terminal Rule

The AI agent must NEVER wait for long-running terminal processes.

Examples:

- npm install
- npm run dev
- npm run build
- npx ...
- supabase ...
- node server.js / nodemon

Instead:

1. Print the exact command.
2. Ask the user to run it.
3. Continue after confirmation.

Never poll timers.
Never repeatedly wait.
Never enter waiting loops.

## UI/UX Rule

Think like you are designing software a citizen will use once, in a hurry, standing next to a pothole or a broken streetlight.

Every pixel should justify its existence.

The report flow (photo → auto-fill → submit) must stay as short as possible. Do not add extra required fields to the citizen-facing report form.

Prefer clarity and speed over decorative styling. The feed and status views should feel like a lightweight social/civic app, not an enterprise dashboard.

## Database-First Rule

Whenever a feature requires adding, removing, or modifying database fields:

1. Generate the SQL migration first.
2. Stop and present the SQL migration.
3. Wait for the user to execute it in Supabase.
4. Continue only after confirmation.
5. Then update APIs (Express backend and/or Supabase client calls).
6. Then update React components.

Never assume the live database matches the source code.

Every database change must have a corresponding migration file.

## Handover Rule

Every implementation must end with a HANDOVER.md style summary.

The summary should contain:

- Objective
- Decisions made
- Files modified
- Database changes
- SQL migrations executed/pending
- APIs changed (Supabase + Express)
- Components added
- Remaining TODOs (priority order)
- Known risks
- Exact next task for the following coding agent

Assume another AI agent with no previous context will continue development. Write the handover so they can resume work immediately without re-auditing the repository.

## 1. Project Vision

The project is a civic issue reporting platform. A citizen photographs a public infrastructure problem (pothole, broken streetlight, broken traffic light, garbage, etc.), the app captures device GPS coordinates at the moment of capture, and an AI agent auto-generates a title, description, and category from the photo. The report is published to a public, social-media-style feed where other citizens can view, like, and comment, surfacing issues to government attention. Government officials can view detailed reports and move each report through a status pipeline. Admins manage users, roles, and moderate content.

The system prioritizes a fast, low-friction citizen reporting flow and a clear, auditable status pipeline for officials over broad feature scope.

## 2. Business Rules

- The application is a civic issue reporting and tracking tool, not a general ticketing/helpdesk platform.
- The primary business objects are users, issue reports, report media, report status history, likes, and comments.
- A report is created by a CITIZEN, is publicly visible in the feed, and can only have its status changed by a GOVERNMENT_OFFICIAL or ADMIN.
- Status values move forward through a fixed pipeline: posted → action_taken → fixed. Officials should not be able to silently delete a report; closing/rejecting it must remain visible as a status, not a deletion.
- Geolocation is captured via the browser Geolocation API at the moment the citizen submits the photo — not derived from photo EXIF data.
- AI auto-fill (title, description, category suggestion) runs server-side only, never with an AI provider key exposed to the browser.

## 3. Product Scope and Phase Order

Phase 1: authentication, roles, citizen report submission (photo + geolocation + AI auto-fill), public feed (view/like/comment), basic report detail view.

Phase 2: government official dashboard, status pipeline (posted → action_taken → fixed), status history/audit trail, admin user & role management.

Phase 3: analytics/reporting views (issues by area, issues by category, resolution time), map-based feed view, notifications.

The implementation order is fixed. Do not build Phase 3 analytics before the core reporting and status pipeline are reliable.

## 4. Roles and Access

| Role | Description | Access |
|---|---|---|
| ADMIN | Platform administrator | Full CRUD across the application, including user/role management and content moderation |
| GOVERNMENT_OFFICIAL | Municipal/government staff | Read all reports with full detail, update report status (posted → action_taken → fixed), cannot delete reports or manage users |
| CITIZEN | General public / default signup role | Create reports, view the public feed, like and comment on any report, view status of their own and others' reports |

Implementation assumption for the initial phase: any authenticated user without an elevated role defaults to CITIZEN. GOVERNMENT_OFFICIAL and ADMIN roles are assigned manually (by an admin), not self-selected at signup.

## 5. Technical Stack

The stack is fixed and must not be replaced during implementation.

| Layer | Choice |
|---|---|
| Frontend | React with Vite |
| UI library | Material UI |
| Database | PostgreSQL |
| Backend/auth (primary) | Supabase Auth and Supabase Postgres |
| Backend (secondary, AI-only) | Node.js + Express |
| Database client (frontend) | @supabase/supabase-js |
| AI photo analysis | Vision-capable LLM API (Claude/GPT), called only from the Express server |
| Hosting (frontend) | Vercel |
| Hosting (Express backend) | TBD — decide before Phase 1 backend work begins (e.g. Render/Railway/Fly.io) |

### Why Express exists alongside Supabase

Supabase directly covers auth, CRUD, storage, and RLS — the frontend talks to Supabase directly for all of that, no Express involved. Express exists **only** to do the one thing Supabase/the browser cannot safely do: call the AI vision API to auto-generate title/description/category from a submitted photo. That call requires a provider API key, which must never be shipped to or exposed in the browser bundle. Keep the Express surface area intentionally small — it should not become a general-purpose backend or duplicate what Supabase already does.

No Firebase, no service-role key in the browser, no AI provider key in the frontend.

## 6. Coding Standards

- Use functional React components and hooks only.
- Prefer small, focused components and feature-level modules.
- Keep business logic close to the relevant feature. Avoid sprawling shared helpers unless the logic is genuinely reusable.
- Place Supabase queries in feature-level api.js modules rather than inline inside components.
- Place calls to the Express AI endpoint in a single shared client module (e.g. src/lib/aiClient.js), not scattered across components.
- Keep comments rare and only use them for AI auto-fill logic, status transition rules, and RLS rules.
- Favor clarity over clever abstractions.
- Do not introduce state libraries or form libraries unless the implementation absolutely requires them.

## 7. React Standards

- Use React Router for navigation and route-level composition.
- Use Material UI primitives as the default UI building blocks.
- Prefer controlled inputs and simple validation over complex form frameworks.
- Maintain clear loading, empty, and error states for every list and detail view, including the AI auto-fill step (show a distinct "analyzing photo" state).
- Keep dialogs and drawers lightweight and focused on a single task.
- Use context for application-wide state only when it is truly shared, such as authentication and role.

## 8. Supabase Standards

- Use a single shared Supabase client module for browser access.
- Keep data-access code in feature api modules.
- Treat Row Level Security as part of the product contract, not as an afterthought.
- Use role-based claims in the JWT whenever possible rather than repeatedly querying user metadata in RLS.
- Do not expose service-role credentials in frontend code, environment bundles, or deployment configuration.
- Use Supabase Storage for report photos, with RLS/storage policies restricting who can upload vs. who can read.

## 9. Express Standards (AI service only)

- The Express app should expose a minimal surface: effectively one endpoint that accepts a photo (or its Supabase Storage reference) and returns a suggested title, description, and category.
- Store the AI provider key only in the Express server's environment, never in the frontend.
- Validate and sanitize the AI response before returning it to the frontend — the citizen must still be able to review/edit the auto-filled fields before submitting.
- Keep the Express server stateless where possible; it should not become a second source of truth for report data.

## 10. Database Standards

- Use PostgreSQL and keep the schema explicit and relational.
- Add created_at and updated_at columns to every business table.
- Prefer database-enforced integrity over frontend-only checks for status transitions.
- Keep status changes authoritative in a status-history table, not just a mutable column, so the pipeline is auditable.
- Use triggers or database functions for derived values (e.g. like counts, comment counts) rather than relying on UI state.

## 11. Folder Conventions

The repository should follow a feature-first structure:

```text
src/
  app/                 # theme, providers, app shell
  lib/                 # shared clients (supabaseClient, aiClient) and utilities
  routes/              # route declarations and guards
  features/            # domain modules
  components/          # reusable UI building blocks
  hooks/               # shared hooks
server/                # Express app (AI auto-fill service only)
  routes/
  lib/
```

Each frontend feature should contain:
- api.js for Supabase access
- page components for main routes
- feature components for local UI composition
- feature-specific helpers only when necessary

## 12. Naming Conventions

- Use camelCase for JavaScript and TypeScript variables and functions.
- Use PascalCase for React component names.
- Use snake_case for database objects and PostgreSQL columns.
- Use descriptive names for business concepts such as issueReport, reportStatusHistory, and reportComment.
- Avoid abbreviations that hide intent.

## 13. Security Rules

- Never commit secrets or credentials, including the AI provider API key.
- Use only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the browser environment.
- Keep the AI provider key exclusively in the Express server's environment.
- Keep Row Level Security enabled for all user-facing tables.
- Deny access by default whenever a table is not explicitly meant to be accessible to a role.
- Do not allow direct client-side editing of another user's report status; status changes go through role-gated logic (officials/admins only), enforced in RLS.

## 14. Git Workflow

- Create a short-lived branch for each implementation task.
- Keep commits atomic and focused on one concern at a time.
- Use descriptive commit messages that reflect user-visible changes or architectural decisions.
- Prefer small pull requests with clear validation notes.

## 15. Definition of Done

A feature is considered complete when:
- the database contract and RLS rules are defined,
- the UI and API work for the requested flow are implemented,
- validation and error handling are present (including AI auto-fill failure/fallback),
- the feature works for at least one permitted and one prohibited role path,
- the documentation remains consistent with the implementation,
- and the change does not break adjacent workflows.

## 16. Development Workflow

1. Confirm the business requirement and the relevant database contract.
2. Define or update the schema and RLS policy before implementing UI.
3. Implement feature-level API modules (Supabase) and, if needed, the Express endpoint.
4. Build the UI flow with clear loading and error handling.
5. Verify the flow against the intended role and the expected denial path.
6. Update documentation when the implementation changes the architecture or product rules.

## 17. Performance Rules

- Keep feed queries efficient and paginated — do not load the entire report history at once.
- Prefer pagination or server-side filtering for the public feed and official dashboard.
- Avoid loading full-resolution images in the feed list view; use a thumbnail/preview size.

## 18. Accessibility

- All interactive controls (like, comment, status change) must be keyboard accessible.
- Provide visible focus states and meaningful labels.
- Ensure form errors and validation messages are announced clearly.
- Use semantic markup and avoid relying on color alone to communicate status (pair status chips with text/icon).

## 19. Error Handling

- Handle network, authentication, permission, geolocation, and AI-service errors explicitly.
- If the AI auto-fill call fails or times out, fall back to an empty/manual-entry form rather than blocking submission.
- If the browser denies geolocation permission, block submission with a clear message rather than silently posting without a location.
- Distinguish between user error, system error, and authorization error.

## 20. Validation Rules

- Required fields for a report: photo, geolocation, title, description, category.
- The citizen must be able to review and edit AI-suggested fields before submitting — never auto-submit AI output.
- Do not trust the frontend as the sole source of truth for report status; status transitions are enforced in the database/RLS.

## 21. AI Agent Rules

- Preserve the existing architecture unless a change is explicitly required.
- Do not introduce speculative patterns or alternate stacks.
- When changing documentation, keep the useful parts of the current guidance and remove contradictions.
- If a requirement is ambiguous, document the chosen assumption and keep it consistent.
- Prefer the simplest implementation path that satisfies the current phase.

## 22. Never-Do Rules

- Do not replace the chosen stack.
- Do not expand Express into a general-purpose backend duplicating Supabase's job.
- Do not place secrets (Supabase service key or AI provider key) in the frontend bundle or source control.
- Do not allow a report's status to be changed by anyone other than GOVERNMENT_OFFICIAL or ADMIN.
- Do not let the UI calculate/display report status independent of the database value.
- Do not skip Row Level Security.
- Do not build Phase 3 analytics before the core reporting and status pipeline are stable.
