# HANDOVER.md — Instagram Web-Style Report Detail & Official Audit Redesign

## Objective
Replace the long, single-column scrollable report view with an **Instagram Web Post View** across both citizen report details (`ReportDetailPage.jsx`) and official audit modal (`ReportDetailDialog.jsx`):
1. **Left Side Frame**: Dark letterbox frame with full-height contain-fit photo, floating status chip, and category badge.
2. **Right Side Frame**:
   - **Sticky Top Header**: Reporter avatar, name, official/admin badge, owner options menu, and close button `X`.
   - **Scrollable Middle Area**: Post title, full description, geolocation with map link, official status pipeline controls (for officials/admins), status audit history timeline, and community comments stream.
   - **Docked Bottom Footer**: Instagram action icons (heart like button, comment button, map button), like count, date, and docked `"Add a comment..."` input with `"Post"` button.
3. **Mobile Responsiveness**: Stacks cleanly into an Instagram mobile post format with zero horizontal overflow or double scrollbars.

---

## Decisions Made
1. **Unified Shared View**:
   - `ReportDetailContent.jsx` acts as the single source of truth for both the standalone `/report/:id` view and the `ReportDetailDialog.jsx` modal (used in Official Dashboard, Notifications, Explore, and Profile). Updating it upgrades all 5 surfaces at once.
2. **Instagram Web Split Proportions**:
   - On desktop (`md` and up): 58% left media column and 42% right interactive sidebar.
   - Height locked at `84vh` inside dialogs and `78vh` on standalone page, eliminating nested scrollbars and delegating scrolling exclusively to the middle comments/audit section.
3. **Docked Comment & Like Action Bar**:
   - The like button, like count, and comment input are pinned to the bottom of the right panel, mirroring Instagram Web. Comments appear immediately in the scrollable stream above with auto-scroll.
4. **Bugfix for Liked State & Like Toggle**:
   - Fixed `TypeError: likedIds.includes is not a function` by correctly checking `likedIds.has(reportId)` on the `Set` returned by `fetchUserLikedReportIds`.
   - Fixed `toggleReportLike` parameter call from positional to object signature `{ reportId, userId, isLiked }`.

---

## Files Modified
- [src/features/officialDashboard/components/ReportDetailDialog.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/ReportDetailDialog.jsx) *(MODIFY)*: Upgraded to edge-to-edge modal with `maxWidth="lg"` and zero padding.
- [src/features/reportDetail/components/ReportDetailContent.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/ReportDetailContent.jsx) *(MODIFY)*: Redesigned into two-column Instagram web post view with docked actions and scrollable comments.

---

## Database Changes & Migrations
- None.

---

## APIs Changed
- None (pure UI/UX transformation).

---

## Remaining TODOs (Priority Order)
1. **Smoke Test in Browser**:
   - In `/feed`, `/explore`, or `/dashboard`, click any report to open the audit dialog.
   - Verify the 2-column Instagram layout on desktop.
   - Test like button, posting a comment, and advancing report status as an official.
   - Resize to mobile width (<600px) and verify clean vertical stacking.
