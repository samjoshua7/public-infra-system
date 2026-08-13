# EXECUTION_PLAN_06.md — Official Dashboard Redesign: No Feed, Popup Detail, Inline Actions

This plan replaces the official's experience entirely: no access to the citizen feed, a dedicated administrative table as their only working surface, a detail popup instead of page navigation, and inline row-level actions to advance a report's status without leaving the table. Read `AGENTS.md`, `ARCHITECTURE.md`, `EXECUTION_PLAN_02.md`, `EXECUTION_PLAN_04.md`, and `EXECUTION_PLAN_05.md` first — this plan modifies pages those built.

## 0. Already Done (do not redo)

- ✅ Official dashboard exists at `/dashboard` with pagination + column sorting (`EXECUTION_PLAN_04.md`) and the 4-stage status pipeline with mandatory comment (`EXECUTION_PLAN_05.md`, `src/lib/reportStatus.js`).
- ✅ `src/features/officialDashboard/OfficialDashboardPage.jsx` currently has a "Review" button per row that navigates to `/report/:id` (the same page citizens use) — **this plan removes that navigation and replaces it with an in-place popup.**
- ⚠️ Known bug already fixed directly (not by an agent) in `OfficialDashboardPage.jsx`: a leftover `statusColors`/`mode` reference was removed and replaced with the shared `STATUS_COLORS`/`STATUS_LABELS` from `src/lib/reportStatus.js`. Don't reintroduce a separate color/label scheme — keep using that shared file for anything status-related in this plan too.

## 1. Officials Never See the Citizen Feed

1. In `src/routes/index.jsx`: wrap the `/feed` route (and `/report/new`, the citizen submission flow) in a guard that excludes `GOVERNMENT_OFFICIAL` — if an official hits either URL directly, redirect to `/dashboard`. Reuse or extend the existing `RoleGuard.jsx` pattern from `EXECUTION_PLAN_02.md` (it currently allows-lists roles; you can either add a second "exclude" mode or just wrap `/feed` and `/report/new` with `RoleGuard allowedRoles={['CITIZEN', 'ADMIN']}`).
2. In `src/components/layout/AppHeader.jsx`: remove the "Feed" and "New Report" nav links entirely when `role === 'GOVERNMENT_OFFICIAL'` — an official's only nav destination is the dashboard (plus logout). Confirm login/signup redirect logic already sends officials straight to `/dashboard` (built in `EXECUTION_PLAN_04.md`) — verify it still does after this change, don't rebuild it if it's already correct.
3. Individual report detail is still reachable for officials, but **only through the new in-dashboard popup** (Section 3) — not as a separate page navigation. Officials should have no reason to ever see the standalone `/report/:id` route in normal use.

## 2. Extract Reusable Detail Content (avoid duplicating the detail page)

1. `src/features/reportDetail/ReportDetailPage.jsx` currently renders everything inline: photo, title/description/category, status history timeline, like/comment section, and (per `EXECUTION_PLAN_02.md`) the owner edit/hide/delete menu and (per `EXECUTION_PLAN_05.md`) the official's `StatusUpdateControl`.
2. Extract the actual content — everything except the page-level chrome (any full-page header/back-button wrapper) — into a new component: `src/features/reportDetail/components/ReportDetailContent.jsx`, taking `reportId` (or the already-loaded report object) as a prop.
3. `ReportDetailPage.jsx` becomes a thin wrapper: fetch the report, render `<ReportDetailContent reportId={id} />` inside its existing page layout. Behavior for citizens/admin visiting `/report/:id` directly must not change.
4. This extraction is what lets the official dashboard show the exact same detail view in a popup without maintaining two separate implementations that can drift apart (the `statusColors` bug from `EXECUTION_PLAN_05.md` happened partly from divergent copies — don't repeat that pattern here).

## 3. Detail Popup on Row Click

1. Create `src/features/officialDashboard/components/ReportDetailDialog.jsx` — an MUI `Dialog` (`fullWidth`, `maxWidth="md"`, scrollable content) that renders `<ReportDetailContent reportId={selectedReportId} />` from Section 2, plus a close button (`IconButton` with `CloseIcon` in the dialog title area).
2. In `OfficialDashboardPage.jsx`: clicking anywhere on a table row (except explicit action buttons/controls in the Action column — see Section 4) opens this dialog for that row's report. Track `selectedReportId` in state; `null` means closed.
3. Remove the old "Review" `Button`/`RouterLink` that navigated to `/report/:id` — officials no longer leave the dashboard page for this.
4. After a status change inside the dialog (via the `StatusUpdateControl` that's already part of `ReportDetailContent`), refresh the underlying table row's data when the dialog closes (or live-update it) so the table doesn't show a stale status after the popup is dismissed.

## 4. Inline "Advance Status" Row Action (quick action, no popup needed)

This is a **second, separate** affordance from Section 3 — a fast path for the common case ("just move this one report forward") without opening the full detail view.

1. Create `src/features/officialDashboard/components/QuickAdvanceDialog.jsx` — a small, focused `Dialog` (not the full detail view) containing: the report's title (for context), current status chip, next status label (from `getNextStatusLabel()` in `src/lib/reportStatus.js`), a required multiline comment field, and a confirm button disabled until the comment is non-empty. Same mandatory-comment rule as `StatusUpdateControl.jsx` from `EXECUTION_PLAN_05.md` — reuse that component's logic/validation rather than reimplementing it if it's already extractable; otherwise mirror its behavior exactly.
2. In the table's Action column, add a small button/icon (e.g. an "Advance →" chip-button, disabled/hidden when status is already `finished`) that opens `QuickAdvanceDialog` for that row directly — this must **not** also trigger the row-click popup from Section 3 (stop event propagation on this button's click handler).
3. On successful advance, refresh just that row's data in the table (or refetch the current page) so the status column updates immediately.
4. Keep the row still clickable elsewhere (Section 3) for officials who want the full picture before deciding — the quick action is an accelerator, not a replacement.

## 5. Table Polish (the "real admin feel")

1. Confirm every column already in `OfficialDashboardPage.jsx` (title/photo, category, reporter, submitted date, likes, status, action) stays — this plan doesn't remove data, it changes how a row is interacted with.
2. Action column now has two controls per row: the quick "Advance" button (Section 4) and an explicit "View" icon-button (e.g. `VisibilityIcon`) that also opens the Section 3 dialog — so there's always an obvious explicit trigger for the popup even though the whole row is also clickable. Both must `stopPropagation` correctly so clicking either button doesn't double-fire the row's own click handler.
3. Add a hover state (row background highlight) so it's visually obvious the row is clickable — a standard admin-table affordance, use MUI's `hover` prop on `TableRow` if not already present (it may already be from earlier plans — verify, don't duplicate).
4. Cursor should be `pointer` on the row (excluding the two action buttons, which have their own default button cursor).

## 6. Step-by-Step Execution Order

1. Section 1 — route/nav restriction for officials (quick, low-risk, do first).
2. Section 2 — extract `ReportDetailContent.jsx` from `ReportDetailPage.jsx`. Test that `/report/:id` still works exactly as before for citizens/admin before moving on — this is a refactor, it must be behavior-neutral for the existing page.
3. Section 3 — build `ReportDetailDialog.jsx`, wire up row-click in `OfficialDashboardPage.jsx`.
4. Section 4 — build `QuickAdvanceDialog.jsx`, wire up the inline action.
5. Section 5 — table polish pass.
6. Manually test as the official account: confirm `/feed` redirects to `/dashboard`, confirm nav has no Feed/New Report links, confirm row click opens the popup, confirm the quick-advance button works independently without opening the popup, confirm both correctly update the table afterward.
7. `npm run build` — must succeed with no errors.

## 7. Definition of Done

- An official account never sees the citizen feed or submission flow, by URL or by nav link.
- Clicking a table row (or its explicit "View" button) opens a detail popup in place — no page navigation, no leaving the dashboard.
- A separate "Advance" action per row lets an official move a report to its next status with a mandatory comment, without opening the full popup, and the table reflects the change immediately.
- `/report/:id` still works unchanged for citizens and admin (the extraction in Section 2 didn't alter its behavior).
- `npm run build` succeeds.
- End with a `HANDOVER.md` update per AGENTS.md.

## 8. What YOU (Joshua) Need to Do

Nothing in Supabase — this is a pure frontend plan, no migration needed. After the agent finishes:
1. `npm run build` yourself to confirm it's clean.
2. Log in as the official account and confirm you land on `/dashboard` with no way to reach the feed.
3. Test both the row-click popup and the quick "Advance" action separately, including that the comment field is genuinely required in both places (not just visually — try leaving it empty and confirm the button stays disabled).
