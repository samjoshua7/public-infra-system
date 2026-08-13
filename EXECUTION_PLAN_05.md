# EXECUTION_PLAN_05.md — 4-Stage Status Pipeline, Mandatory Comments, Official UI Parity

This plan replaces the 3-stage report status pipeline with a 4-stage one, makes a comment mandatory on every status change, and brings the official dashboard's look and workflow in line with the admin panel. Read `AGENTS.md`, `ARCHITECTURE.md`, and `DATABASE.md` first — then read this plan fully before touching any file, since the status rename touches many places and missing even one causes a broken build or a silent bug (a card showing "posted" forever, a filter that matches nothing, etc.).

## 0. Already Done (do not redo)

- ✅ `supabase/migrations/005_status_pipeline_rework.sql` — already executed by the user. New status values: `ordered`, `budget_allocated`, `on_process`, `finished` (replacing `posted`, `action_taken`, `fixed`). Existing data was migrated (`posted→ordered`, `action_taken→on_process`, `fixed→finished`). `update_report_status(report_id, new_status, note)` now REQUIRES a non-empty `note` — it throws if `note` is null/empty. The owner edit/delete "only in the first stage" rule now checks `status = 'ordered'` instead of `'posted'`.

## 1. Mandatory First Step: Centralize Status Config (do this before anything else)

Create **one** new file: `src/lib/reportStatus.js`. Every single place in the app that shows a status label, a status color, a status filter option, or decides the "next" status MUST import from this file — never hardcode the status strings or their display labels anywhere else. This is the single biggest thing that prevents a missed spot.

```js
// src/lib/reportStatus.js
export const STATUS_ORDER = ['ordered', 'budget_allocated', 'on_process', 'finished'];

export const STATUS_LABELS = {
  ordered: 'Ordered',
  budget_allocated: 'Budget Allocated',
  on_process: 'On Process',
  finished: 'Finished',
};

// MUI color keys — pick a palette that reads clearly in both light and dark
// mode per the existing theme (see src/app/theme/theme.js). Suggested:
export const STATUS_COLORS = {
  ordered: 'default',        // neutral grey — just submitted
  budget_allocated: 'info',  // blue — in planning
  on_process: 'warning',     // amber — actively being worked
  finished: 'success',       // green — done
};

export function getNextStatus(currentStatus) {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null; // no next stage
  return STATUS_ORDER[idx + 1];
}

export function getNextStatusLabel(currentStatus) {
  const next = getNextStatus(currentStatus);
  return next ? STATUS_LABELS[next] : null;
}
```

## 2. Find Every Old Reference (do this before writing new code)

Search the whole repository (case-sensitive) for these literal strings and review every hit: `'posted'`, `"posted"`, `'action_taken'`, `"action_taken"`, `'fixed'`, `"fixed"`, plus the display words `Posted`, `Action Taken`, `Fixed` used as UI labels (careful: don't touch unrelated uses of the English word "fixed" that have nothing to do with report status — read context). Known likely locations based on prior plans (verify each still exists and check for others):

- `src/components/cards/StatusChip.jsx` (or wherever the status chip component lives)
- `src/features/reportDetail/ReportDetailPage.jsx` (status history timeline labels/colors)
- `src/features/feed/FeedPage.jsx` (status filter tabs/dropdown)
- `src/features/officialDashboard/OfficialDashboardPage.jsx` (status filter tabs, table column, status update control)
- `src/features/officialDashboard/api.js` (any hardcoded status string in queries)
- `src/features/officialDashboard/components/StatusUpdateControl.jsx`
- `src/features/reportSubmission/ReportSubmissionPage.jsx` or its success messaging (e.g. "Your report has been posted" copy)
- `src/features/reportDetail/api.js` (delete/edit eligibility checks, if any client-side pre-check mirrors the DB rule — e.g. "can I show the Edit button" logic checking `status === 'posted'`)

Replace every hardcoded value/label with the corresponding import from `src/lib/reportStatus.js`. Do not leave any string literal `'posted'`, `'action_taken'`, or `'fixed'` anywhere in `src/`.

## 3. Mandatory Comment on Status Change

### `StatusUpdateControl.jsx`
1. Add a required multiline `TextField` labeled "Comment (required)" above the status-change button.
2. The "Move to [next stage]" button (label built from `getNextStatusLabel(currentStatus)`) must be **disabled** until the comment field is non-empty (trim and check length > 0) — this mirrors the DB rule so the user never hits the raised exception in the normal case.
3. On click, call the existing RPC wrapper (`updateReportStatus(reportId, nextStatus, note)` in `officialDashboard/api.js`) with the comment as `note`. Clear the field on success.
4. If the DB still rejects it (e.g. race condition, someone else already moved it), show the raised exception message in an inline alert — don't crash.
5. When `currentStatus === 'finished'`, don't render the control at all (no next stage) — show a plain "Finished" chip instead.

### `ReportDetailPage.jsx` status history timeline
Each entry already shows `note` if present (from `EXECUTION_PLAN_01.md`'s original timeline). Since `note` is now always present for every official-driven transition, this needs no structural change — just confirm the label/color for each entry comes from `STATUS_LABELS`/`STATUS_COLORS` (Section 1), not the old hardcoded switch.

## 4. Official Dashboard: Visual & Workflow Parity with Admin Panel

The official dashboard currently has its own sorting/pagination implementation (from `EXECUTION_PLAN_04.md`) that's functionally similar to the admin panel's but was built as a separate, divergent implementation. Bring them into visual and structural alignment:

1. Compare `AdminUsersPage.jsx`'s layout (page header style, filter/tab placement, table header styling, pagination control placement and page-size, spacing/padding, card/paper wrapper) against `OfficialDashboardPage.jsx`. Make the official dashboard match that same structural pattern — same header treatment, same filter-bar placement above the table, same pagination component and default page size, same table header sort-arrow styling (`TableSortLabel`).
2. If `AdminUsersPage.jsx` uses a tabbed layout (per `EXECUTION_PLAN_04.md`'s "User Management" / "System Settings" tabs), give the official dashboard an analogous tab structure if it makes sense for officials — e.g. a "Reports" tab (the existing table) plus room for a future tab, OR at minimum the same single-page header/card chrome even without multiple tabs. Use judgement: don't force a second tab that has nothing in it just for parity — the goal is *visual and interaction consistency*, not an identical feature set.
3. Status filter on the official dashboard: update from the old 3 options to "All / Ordered / Budget Allocated / On Process / Finished", built from `STATUS_ORDER`/`STATUS_LABELS` (Section 1) — never a separate hardcoded list.
4. The existing "Likes" column/sort (added in `EXECUTION_PLAN_04.md` so officials can gauge importance) stays — keep it sortable, keep it visible, it's core to the workflow the user asked for ("officials work on important problems").
5. If any reusable sub-components emerge naturally from this alignment (e.g. a shared `SortablePaginatedTable` wrapper), extracting one is welcome but not required — don't force an abstraction just for its own sake if the two tables' columns are different enough that it adds more complexity than it saves. Use judgement.

## 5. Step-by-Step Execution Order

1. Create `src/lib/reportStatus.js` (Section 1).
2. Grep and catalog every hit from Section 2 before editing anything — make a checklist and work through it one file at a time so nothing is missed.
3. Update `StatusChip` (or equivalent) to use the new config.
4. Update `StatusUpdateControl.jsx` for the mandatory comment + new 4-stage transitions (Section 3).
5. Update `ReportDetailPage.jsx` timeline to use the new config (Section 3).
6. Update `FeedPage.jsx` status filter to the new 4 options.
7. Update `OfficialDashboardPage.jsx` for both the status rename AND the visual/workflow parity pass (Section 4).
8. Update any remaining copy/messaging that referenced "posted" (e.g. submission success text).
9. Re-run your Section 2 grep one more time to confirm zero hits remain for the old string literals.
10. `npm run build` — must succeed with no errors.

## 6. Definition of Done

- Every status label, color, and filter option in the app comes from `src/lib/reportStatus.js` — zero hardcoded status strings remain in `src/`.
- An official can move a report `Ordered → Budget Allocated → On Process → Finished`, one stage at a time, and cannot submit a status change without typing a comment.
- Each transition's comment appears in the report's status history timeline, visible to everyone (matches existing `report_status_history` visibility).
- The official dashboard's page chrome (header, filters, table styling, pagination) visually matches the admin panel's established pattern.
- Existing reports created before this migration show their migrated status correctly (spot-check a report that was `action_taken` before — it should now show `On Process`).
- `npm run build` succeeds.
- End with a `HANDOVER.md` update per AGENTS.md, explicitly listing every file touched by the status-rename grep so the next agent has a record of what was checked.

## 7. What YOU (Joshua) Need to Do

Nothing new — migration 005 is already applied. After the agent finishes:
1. `npm run build` yourself to confirm it's clean.
2. Log in as the official account, open a report, and manually walk it through all 4 stages, typing a different comment each time, and confirm each comment shows up in the timeline.
3. Try clicking the status-change button with an empty comment — it should be disabled, not just fail after clicking.
