# EXECUTION_PLAN_02.md — CRUD, Hide, Official Dashboard, Admin Panel

This plan picks up after EXECUTION_PLAN_01.md (Phase 1) and migration `002_reports_crud_and_roles.sql`. It builds the UI surfaces the database/API layer already supports but nothing renders yet: owner edit/delete/hide on reports, the government official status-pipeline dashboard, and the admin user/role management panel.

Read `AGENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, and `supabase/migrations/002_reports_crud_and_roles.sql` before starting — the RLS/trigger rules in that migration are the actual source of truth for what's allowed; the UI only needs to expose those paths and handle their errors, not re-implement the rules.

## 0. Already Done (do not redo)

- ✅ `supabase/migrations/002_reports_crud_and_roles.sql` — `is_hidden` column, owner update/delete RLS + edit-rules trigger, role-bootstrap trigger for the two known accounts, and a security fix blocking self-role-escalation. Already executed by the user in Supabase.
- ✅ `src/lib/imageCompression.js` — canvas-based compression, already wired into `ReportSubmissionPage.jsx`.
- ✅ `src/features/reportDetail/api.js` — already has `updateReportDetails(reportId, {title, description, category})`, `setReportHidden(reportId, isHidden)`, `deleteReport(reportId)`. Use these; do not duplicate them.
- ✅ Submission flow already avoids orphaned Storage uploads (photo uploads only at final submit).
- ⚠️ `server/.env` `GEMINI_MODEL` may still need one correction depending on which model string the user's key actually supports — check with the user before assuming `gemini-2.5-flash-lite` works; if they say another model string works, update `server/.env` and `server/.env.example` to match, and update `server/lib/geminiClient.js`'s fallback default too.

## 1. Scope of This Plan

- Owner-facing edit / delete / hide controls on a citizen's own reports (feed card + detail page).
- Government official dashboard: list of reports with detail view and status pipeline controls (posted → action_taken → fixed).
- Admin panel: list of users with role management (CITIZEN / GOVERNMENT_OFFICIAL / ADMIN), respecting that only an admin can change roles (enforced in DB already — UI just needs to call it and handle the error path gracefully for non-admins, though non-admins won't reach this route at all per the guard below).
- Route guards so `/dashboard` (official) and `/admin` (admin) are inaccessible to citizens.

Out of scope: analytics/map view (Phase 3 per ROADMAP.md).

## 2. New/Changed Files

```text
src/
  routes/
    index.jsx                          (add /dashboard and /admin routes, both guarded)
    guards/
      RoleGuard.jsx                    (new — restricts a route to specific roles)
  features/
    feed/
      components/
        ReportCard.jsx                 (add owner-only menu: Edit / Hide-Unhide / Delete)
    reportDetail/
      ReportDetailPage.jsx             (add owner-only Edit / Hide-Unhide / Delete controls)
      components/
        EditReportDialog.jsx           (new)
        DeleteReportConfirmDialog.jsx  (new)
    officialDashboard/
      api.js                          (new — list reports for officials, wraps update_report_status RPC)
      OfficialDashboardPage.jsx       (new)
      components/
        StatusUpdateControl.jsx      (new)
    admin/
      api.js                          (new — list users, update a user's role)
      AdminUsersPage.jsx             (new)
```

## 3. Step-by-Step Execution

### Step 1 — Role guard
1. Create `src/routes/guards/RoleGuard.jsx`: takes `allowedRoles` (array) and `children`. Reads role from `useAuth()`/`usePermissions()`. If the session is still loading, render a loading state. If not authenticated, redirect to `/login`. If authenticated but role not in `allowedRoles`, redirect to `/feed`. Otherwise render children.
2. Wrap `/dashboard` in `<RoleGuard allowedRoles={['GOVERNMENT_OFFICIAL', 'ADMIN']}>` and `/admin` in `<RoleGuard allowedRoles={['ADMIN']}>` in `src/routes/index.jsx`.
3. Also hide (don't just block) the nav links to these routes in `AppHeader.jsx` for roles that can't use them — check `role` from `useAuth()`.

### Step 2 — Owner edit / hide / delete on the feed card and detail page
1. `ReportCard.jsx` and `ReportDetailPage.jsx`: when `reporterId === currentUser.id` (or role is ADMIN), show a small overflow menu (MUI `IconButton` + `Menu`, three-dot icon) with:
   - **Edit** — opens `EditReportDialog` (only enabled/shown if `status === 'posted'`; for other statuses, show the option disabled with a tooltip "Can't edit after action has been taken" — this mirrors the DB trigger rule, don't let the user hit the error unnecessarily).
   - **Hide from feed** / **Unhide** (toggle label based on current `is_hidden`) — always available to the owner regardless of status. Calls `setReportHidden`.
   - **Delete** — opens `DeleteReportConfirmDialog`; only enabled if `status === 'posted'` (same rule as edit, mirrors RLS). Calls `deleteReport`, then navigates back to `/feed` if deleting from the detail page, or removes the card from the list if deleting from the feed.
2. `EditReportDialog.jsx`: simple MUI Dialog with Title/Description/Category fields pre-filled from the current report, Save calls `updateReportDetails`, on success updates local state/refetches.
3. `DeleteReportConfirmDialog.jsx`: standard confirm dialog — "This can't be undone." Calls `deleteReport` on confirm.
4. Wrap every one of these calls in try/catch — if the DB trigger/RLS rejects the action (e.g. status changed to `action_taken` between page load and click), show the returned error message in a toast/alert rather than crashing.
5. On the feed list, a hidden report owned by the current user should still show a subtle "Hidden — only visible to you" badge (matches the `is_hidden` RLS visibility rule from migration 002: hidden reports are only visible to their owner and to officials/admins).

### Step 3 — Official dashboard
1. `src/features/officialDashboard/api.js`:
   - `listReportsForOfficial({ status, page })` — same shape as the feed query but not filtered by `is_hidden` (officials should see hidden reports too, matching the RLS visibility rule), paginated, filterable by status.
   - `updateReportStatus(reportId, newStatus, note)` — calls the Supabase RPC `update_report_status(p_report_id, p_new_status, p_note)` (already defined in `001_init.sql`). Let the DB's own validation (forward-only transitions, role check) be the source of truth — surface its raised exception message directly to the UI on failure.
2. `OfficialDashboardPage.jsx`: paginated list/table of reports (photo thumbnail, title, category, current status, reporter name, created date), with status filter tabs (All / Posted / Action Taken / Fixed). Clicking a row opens the existing `ReportDetailPage` (reuse it — don't build a second detail view) but with `StatusUpdateControl` visible (see below).
3. `StatusUpdateControl.jsx`: shown only when role is GOVERNMENT_OFFICIAL or ADMIN. Shows the current status and a button for the single valid next transition (posted → "Mark Action Taken", action_taken → "Mark Fixed"; nothing shown once `fixed`). Optional short note field passed to `updateReportStatus`. On success, refresh the report detail and its status history timeline.
4. Add this control into `ReportDetailPage.jsx` conditionally (role-gated), rather than duplicating the whole detail page.

### Step 4 — Admin panel
1. `src/features/admin/api.js`:
   - `listUsers({ page })` — selects from `public.users` (id, name, email, role, active, created_at), paginated.
   - `updateUserRole(userId, newRole)` — updates `public.users.role`. This will only succeed for an actual admin caller (enforced by the `trg_users_enforce_role_change` trigger from migration 002) — surface the DB error if it's ever hit by mistake.
2. `AdminUsersPage.jsx`: table of users (name, email, role, joined date) with a role `Select` dropdown per row (CITIZEN / GOVERNMENT_OFFICIAL / ADMIN). Changing it calls `updateUserRole` and shows a success/error toast. No self-demotion protection needed at this stage — just don't let the table be empty/broken if the admin changes their own role by accident (refetch after change either way).
3. No "create admin" button — per the user's explicit instruction, there is exactly one super admin account, bootstrapped in the database via migration 002. This panel only re-assigns CITIZEN ↔ GOVERNMENT_OFFICIAL (and, in principle, ADMIN, though there's no product need to ever use that here).

### Step 5 — Polish pass
1. Confirm all new pages have loading, empty, and error states.
2. Confirm the overflow menu / dialogs are keyboard accessible.
3. Confirm light/dark theme looks correct on all new screens.
4. Run `npm run build` — must succeed with no errors.

## 4. Definition of Done

- A citizen can edit (while `posted`), hide/unhide (any time), and delete (while `posted`) their own report from both the feed card and the detail page, and cannot do any of this to someone else's report.
- A government official can log in, see `/dashboard`, and move a report through `posted → action_taken → fixed`; a citizen cannot reach `/dashboard` at all.
- An admin can log in, see `/admin`, and change any user's role between CITIZEN and GOVERNMENT_OFFICIAL; a non-admin cannot reach `/admin` at all.
- `npm run build` succeeds.
- End this plan with a `HANDOVER.md` update per the Handover Rule in AGENTS.md.

## 5. What YOU (Joshua) Need to Do

Nothing new in Supabase — migration 002 is already applied. Just:

1. Confirm which Gemini model string your API key actually supports (see the curl test) and tell the coding agent the exact string if it's not `gemini-2.5-flash-lite`, so it can update `server/.env`, `server/.env.example`, and the fallback default in `server/lib/geminiClient.js` together.
2. To test the official/admin flows locally, sign up two throwaway accounts using the exact bootstrap emails:
   - `samc.ug.24.cs@francisxavier.ac.in` → will auto-become GOVERNMENT_OFFICIAL on signup.
   - `samjoshua.paldwin@gmail.com` → will auto-become ADMIN on signup.
   - Everything else you sign up with defaults to CITIZEN, which is what you want for testing the citizen edit/hide/delete paths.
3. After the coding agent finishes, run `npm run build` yourself and confirm it's clean before considering this plan done.
