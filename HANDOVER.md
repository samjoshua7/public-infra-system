# HANDOVER.md — Civic Voice Sharp Monochrome Design & Responsive PC/Mobile Navigation

## Objective
1. Completely removed bright blues, pinks, and saturated colors, establishing a sleek, minimalist **Monochrome / Charcoal / Slate design system**.
2. Standardized all buttons, chips, tags, and inputs to **sharp geometric 4px corners** (`borderRadius: 4px`), eliminating all bubbly/pill curves.
3. Implemented a dual-audience responsive navigation architecture:
   - **PC / Desktop Users**: Left fixed sidebar (`DesktopSidebar`, 240px) + Desktop header (`AppHeader`).
   - **Mobile Users**: Sleek compact top bar (`MobileTopBar`, 52px) + WhatsApp-style bottom navigation (`MobileBottomNav`, 56px fixed at bottom).

---

## Decisions Made
1. **Monochrome Palette (`theme.js`)**:
   - Primary: Solid Charcoal (`#0F172A` in light, `#F8FAFC` in dark).
   - Secondary: Slate (`#64748B`).
   - Surfaces: Light `#F8FAFC`, Dark `#090D14`.
   - Card/Paper: Light `#FFFFFF`, Dark `#111827`.
   - Hairline borders: `#E2E8F0` (light) / `#1F2937` (dark).
2. **Sharp 4px Geometric Corners**:
   - Buttons: `borderRadius: '4px'`.
   - Chips & Filter Pills: `borderRadius: '4px'`.
   - Inputs: `borderRadius: '4px'`.
   - Cards, Papers & Dialogs: `borderRadius: '6px'`.
3. **Responsive Navigation Architecture**:
   - Desktop sidebar (`DesktopSidebar.jsx`) renders on `md`+ with primary action button, main route links, and user identity.
   - Desktop header (`AppHeader.jsx`) renders at top for desktop users.
   - Mobile top bar (`MobileTopBar.jsx`) renders compact brand header on `xs` and `sm`.
   - Mobile bottom nav (`MobileBottomNav.jsx`) renders 5 WhatsApp-style bottom tabs (*Feed*, *Explore*, *Report*, *Activity*, *Profile/Dashboard*) with `position: fixed, bottom: 0`.

---

## Files Modified & Added
- [src/app/theme/theme.js](file:///d:/Git/public-infra-system/src/app/theme/theme.js) — Charcoal primary, sharp 4px button overrides, muted semantic status colors.
- [src/components/layout/AppShell.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppShell.jsx) — Orchestrates desktop sidebar+header vs mobile topbar+bottomnav.
- [src/components/layout/DesktopSidebar.jsx](file:///d:/Git/public-infra-system/src/components/layout/DesktopSidebar.jsx) — Fixed 240px left sidebar for PC users.
- [src/components/layout/AppHeader.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppHeader.jsx) — Desktop top bar aligned with sidebar.
- [src/components/layout/MobileTopBar.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileTopBar.jsx) — Compact 52px top bar for mobile users.
- [src/components/layout/MobileBottomNav.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileBottomNav.jsx) — Fixed WhatsApp-style bottom nav for mobile users.
- [src/features/feed/components/CategoryFilterBar.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/CategoryFilterBar.jsx) — Sharp 4px chips, charcoal active state.
- [src/features/feed/components/ReportCard.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/ReportCard.jsx) — Sharp 4px/6px corners, muted status badges, charcoal link.
- [src/features/feed/FeedPage.jsx](file:///d:/Git/public-infra-system/src/features/feed/FeedPage.jsx) — Sharp 4px status filter chips with charcoal active state.
- [src/features/reportDetail/components/ReportDetailContent.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/ReportDetailContent.jsx) — Sharp 4px/6px corners on timeline and comment boxes.
- [src/features/reportSubmission/ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) — Sharp 6px paper.
- [src/features/reportSubmission/components/PhotoCaptureStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/PhotoCaptureStep.jsx) — Sharp 4px paper/dropzone.
- [src/features/reportSubmission/components/AutoFillReviewStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/AutoFillReviewStep.jsx) — Sharp 4px thumbnail box.
- [src/features/officialDashboard/OfficialDashboardPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialDashboardPage.jsx) — Sharp 6px tables and tabs paper.
- [src/features/officialDashboard/components/QuickAdvanceDialog.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/QuickAdvanceDialog.jsx) — Sharp 6px modal dialog.
- [src/features/officialDashboard/components/ReportDetailDialog.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/ReportDetailDialog.jsx) — Sharp 6px modal dialog.
- [src/features/officialDashboard/components/StatusUpdateControl.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/StatusUpdateControl.jsx) — Sharp 6px paper.
- [src/features/admin/AdminUsersPage.jsx](file:///d:/Git/public-infra-system/src/features/admin/AdminUsersPage.jsx) — Sharp 6px tables and forms.
- [src/features/auth/WaitingApprovalPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/WaitingApprovalPage.jsx) — Sharp 6px card.

---

## Database Changes & Migrations
- No database changes or SQL migrations were required for this UI refactor.
- Database schema, triggers, and RLS policies remain authoritative.

## APIs Changed (Supabase + Express)
- No public API contracts or Express endpoints were changed.

---

## Remaining TODOs (Priority Order)
1. Verify tap target comfort on physical mobile screens for the bottom nav bar.
2. Add end-to-end tests for citizen report flow and official status transitions.

## Known Risks
- Hard browser refresh (`Ctrl + F5`) may be required if old styles or cached bundles are preserved in the browser.

## Exact Next Task for Following Coding Agent
- Verify mobile view by opening devtools device toolbar (< 900px) and switching tabs in the bottom navigation (*Feed*, *Explore*, *Report*, *Activity*, *Profile*).
