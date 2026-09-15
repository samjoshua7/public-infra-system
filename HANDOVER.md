# HANDOVER.md — Fixed Desktop Top Navigation Bar & Right Filter Rail

## Objective
1. **Lock Top Navigation Bar in Fixed Position on Desktop**:
   - In desktop view (`md` and up), the top navigation bar (`AppHeader.jsx`) was previously using `position: sticky` inside an unexpanded 56px wrapper `<Box>`, causing it to scroll away with the page instead of staying locked.
   - Converted `AppHeader.jsx` to `position: 'fixed'`, locked to `top: 0`, `left: 240px`, `right: 0`, with `zIndex: 1100` and `height: 56px`.
   - Updated `AppShell.jsx` main container with `pt: { xs: 2, md: '76px' }` to ensure all page content has proper clearance below the fixed header.
2. **Right Filter Rail**:
   - Anchored on desktop (`position: sticky; top: 76px; alignSelf: flex-start; zIndex: 10`).
   - Sits right underneath the 56px fixed header with 20px breathing room.
   - Pinned in view as the user scrolls down through reports.

---

## Decisions Made
1. **True Fixed Position for Desktop Header (`AppHeader.jsx`)**:
   - Desktop sidebar (`DesktopSidebar`) is fixed at `left: 0, top: 0, width: 240px, zIndex: 1200`.
   - Desktop header (`AppHeader`) is fixed at `left: 240px, top: 0, right: 0, height: 56px, zIndex: 1100`.
   - Main content starts with `pt: 76px` (56px header + 20px gap) and scrolls cleanly underneath the header.
2. **Dual-Lock Desktop Experience**:
   - Both the top navigation bar AND the right filter panel stay locked in place as the user scrolls down.

---

## Files Modified & Created
- [src/components/layout/AppHeader.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppHeader.jsx) *(MODIFY)*: Upgraded to `position: 'fixed'`, `left: '240px'`, `right: 0`, `top: 0`, `height: 56px`.
- [src/components/layout/AppShell.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppShell.jsx) *(MODIFY)*: Removed wrapper box around `AppHeader`, set `pt: { xs: 2, md: '76px' }` on main content, and updated `overflowX` to `'clip'`.
- [src/features/feed/FeedPage.jsx](file:///d:/Git/public-infra-system/src/features/feed/FeedPage.jsx) *(PREVIOUS)*: 2-column layout with pinned right rail at `top: 76px`.
- [src/features/feed/components/FeedFilterPanel.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/FeedFilterPanel.jsx) *(PREVIOUS)*: Consolidated filter panel.

---

## Database Changes & SQL Migrations
- None.

---

## APIs Changed
- None.

---

## Remaining TODOs (Priority Order)
1. **Browser Test**:
   - Refresh `http://localhost:5173/feed` on desktop.
   - Scroll down through the feed.
   - Verify:
     - Top navigation bar stays firmly locked in fixed position.
     - Right filter panel stays firmly locked in sticky position at `top: 76px`.
     - Feed content scrolls cleanly beneath the top header without overlapping.

---

## Known Risks
- None.
