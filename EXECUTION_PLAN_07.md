# EXECUTION_PLAN_07.md — Official Table: Exact Column Spec, Compact Admin Density

`EXECUTION_PLAN_06.md` added the detail popup and a quick-advance action, but the table rows themselves still look like citizen feed cards laid out horizontally (big photo thumbnail, multi-line description text inline) instead of a real admin table. This plan fixes exactly that — the row content, not the popup/action logic, which stays as built in Plan 06.

Read `EXECUTION_PLAN_06.md` first — this plan modifies the table inside `OfficialDashboardPage.jsx` that plan built, not the popup or quick-advance dialog, which are already correct and should not change.

## 0. Already Done / Don't Touch

- ✅ Row click → `ReportDetailDialog` popup (Plan 06) — keep this behavior exactly as-is, just triggered from a leaner row.
- ✅ `QuickAdvanceDialog` inline advance action (Plan 06) — keep the dialog itself unchanged, only its trigger button's placement/styling changes here (see column spec below).
- ✅ `supabase/migrations/006_fix_status_update_self_block.sql` — already fixes the "Status can only be changed via update_report_status()" self-block bug. Already applied by the user. If status updates still fail after this plan, that's a regression to flag, not something to route around client-side.

## 1. The Problem, Precisely

The current table row is essentially the citizen `ReportCard` content laid sideways: a photo thumbnail, a title, a wrapped description snippet, category chip, reporter info, all crammed into wide cells. That reads as a feed, not a dashboard. An admin table row should be scannable in one line, dense, with no wasted vertical space, and the person should be able to tell it's an administrative tool at a glance — before reading a single word.

## 2. Exact Column Spec

Replace the current column set with exactly these columns, in this order:

| # | Column | Content | Sortable? |
|---|--------|---------|-----------|
| 1 | **Date Reported** | `created_at`, formatted short (e.g. `Aug 13, 2026`) — no time, keep it compact | Yes |
| 2 | **Report Title** | Just the title text, single line, `noWrap` with ellipsis overflow — **no photo thumbnail, no description text in the table at all** (both are already in the popup via `ReportDetailContent`) | Yes |
| 3 | **Location** | Not raw lat/long — reverse-format as a short human string if you already have one available (e.g. from a `location_label` field if it exists), otherwise show the coordinates compactly as `lat.toFixed(3), lng.toFixed(3)` — don't add a new geocoding API call/dependency for this, keep it simple | No |
| 4 | **Category** | Small `Chip`, same styling already used elsewhere (keep for context — dropping this entirely would remove useful scanning info the official needs) | Yes |
| 5 | **Status** | `Chip` using `STATUS_LABELS`/`STATUS_COLORS` from `src/lib/reportStatus.js` (unchanged source of truth from Plan 05) | Yes |
| 6 | **Likes** | Compact — just a number with a small heart icon inline, not a full `Chip` with border/background (too heavy for a dense table) — e.g. `❤ 12` as plain text/icon+text, no chip wrapper | Yes |
| 7 | **Actions** | Two small icon buttons only, right-aligned: an eye/`VisibilityIcon` button (opens the Plan 06 `ReportDetailDialog`) and an arrow/`ArrowForwardIcon` button (opens the Plan 06 `QuickAdvanceDialog`) — icon buttons only, no text labels, use `Tooltip` on each so the icon's purpose is still clear on hover | No |

Reporter name/email: **remove from the table entirely** — it's available in the popup (`ReportDetailContent` already shows it), and isn't part of the "at a glance" scan an official needs while triaging.

## 3. Row Density

1. Remove the photo `Box component="img">` entirely from the row.
2. Every `TableCell` should use `sx={{ py: 1 }}` (or similar tight vertical padding) instead of whatever default/larger padding currently makes rows feel card-like — the goal is a visibly denser table than what exists now, more rows visible per screen without scrolling.
3. All text in the row should be a single line — `Typography variant="body2"` with `noWrap`, not `variant="subtitle2"` + a secondary wrapped caption line underneath (that two-line pattern is exactly what made rows feel like stacked cards).
4. Row click still opens the popup (unchanged from Plan 06) — clicking anywhere on the row except the two Action icon buttons (Section 2, column 7) opens `ReportDetailDialog`; stop propagation correctly on both icon buttons as Plan 06 already specifies.

## 4. Header Row

Keep the existing `TableSortLabel` pattern from Plan 04/05 for every sortable column listed above — this part of the implementation was already correct, just apply it to the new column set (drop `TableSortLabel` for Location and Actions, which aren't sortable).

## 5. Step-by-Step Execution Order

1. Confirm migration `006` is applied and a real status update actually succeeds end-to-end before touching UI — if it's still broken, stop and report back, don't build the new table on top of a broken action.
2. Rewrite the `TableHead` in `OfficialDashboardPage.jsx` to the 7-column spec (Section 2), keeping existing sort-handling logic, just retargeting which columns have `TableSortLabel`.
3. Rewrite each `TableRow`/`TableCell` per Section 2 and Section 3 — remove the photo, remove the description, remove reporter info, tighten padding, single-line text throughout.
4. Confirm `ReportDetailDialog` and `QuickAdvanceDialog` triggers (the two Action icon buttons) still work exactly as Plan 06 left them — this plan doesn't change their internals, only how/where they're triggered from in the row.
5. Test at actual screen width an official would realistically use (this is explicitly a desktop-only tool per earlier direction — no need for mobile responsiveness here) — confirm all 7 columns are visible without horizontal scroll on a normal laptop screen.
6. `npm run build` — must succeed with no errors.

## 6. Definition of Done

- The table has exactly the 7 columns from Section 2, in that order, with no photo thumbnail and no inline description text anywhere in a row.
- Each row is visibly compact/dense — a screen shows noticeably more rows than the previous card-like layout did.
- Clicking a row still opens the full detail popup; the two Action icons still independently open the popup / the quick-advance dialog respectively, without interfering with row-click.
- An official can look at the table for two seconds and immediately recognize it as an administrative tool, not a feed.
- `npm run build` succeeds.
- End with a `HANDOVER.md` update per AGENTS.md.

## 7. What YOU (Joshua) Need to Do

Nothing in Supabase for this plan specifically (assuming migration 006 is already run per the earlier fix). After the agent finishes:
1. `npm run build` yourself.
2. Look at the dashboard and confirm it actually reads as an admin table now, not just "the same rows in a slightly different arrangement" — if it still feels card-like, send me a screenshot description and I'll get more specific about what's still off.
