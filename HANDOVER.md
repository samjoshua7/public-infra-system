# HANDOVER.md — EXECUTION_PLAN_04.md: Access Control, Tables, Official Dashboard & Mobile UI

## Objective
Implement Phase 4 features defined in `EXECUTION_PLAN_04.md`: user approval access guard (`pending`/`approved`/`rejected`), waiting for approval page with WhatsApp request button, Super Admin user approval controls and system settings (WhatsApp number & geofencing), table pagination and column sorting across all management tables, server-side geofence validation, official report importance signals (likes), and mobile-first citizen UI responsiveness.

---

## Decisions Made & Architecture

1. **User Approval Access Flow**:
   - Integrated `approval_status` (`pending`, `approved`, `rejected`) into `AuthProvider` / `useAuth`.
   - Created [ApprovalGuard.jsx](file:///d:/Git/public-infra-system/src/routes/guards/ApprovalGuard.jsx) protecting citizen endpoints (`/report/new`, etc.).
   - Created [WaitingApprovalPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/WaitingApprovalPage.jsx) (`/waiting-approval`).
   - Implemented WhatsApp deep link `https://wa.me/<whatsapp_number>?text=...` using setting from `public.app_settings`.
   - Added automatic role & approval based login redirects in [LoginPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/LoginPage.jsx) and [SignupPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/SignupPage.jsx).

2. **Super Admin Control Panel (Users + Settings)**:
   - Updated [AdminUsersPage.jsx](file:///d:/Git/public-infra-system/src/features/admin/AdminUsersPage.jsx) with tab navigation: **User Management** and **System Settings**.
   - User Management: Displays user table with column sorting (`TableSortLabel`), pagination (10/page), approval status chips, and **[ Approve ]** / **[ Reject ]** action buttons.
   - **Self-Protection Rule**: Locked role & approval status controls for the currently logged-in Super Admin row (`u.role === 'ADMIN'`).
   - System Settings: Edit `whatsapp_number`, `geofence_center_lat`, `geofence_center_lng`, and `geofence_radius_km` saved to `public.app_settings`.

3. **Table Pagination & Column Sorting**:
   - Enhanced [AdminUsersPage.jsx](file:///d:/Git/public-infra-system/src/features/admin/AdminUsersPage.jsx) and [OfficialDashboardPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialDashboardPage.jsx) with 10 rows/page default pagination and interactive column sorting (`asc`/`desc` visual indicators).
   - Resets page to 1 upon sort parameter changes.

4. **Geofence Validation**:
   - Implemented Haversine formula distance calculation in [src/lib/geofence.js](file:///d:/Git/public-infra-system/src/lib/geofence.js).
   - Embedded geofence check in [ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx), blocking submission if GPS coordinates exceed the configured radius from the center point.

5. **Official Dashboard & Importance Signal (Likes)**:
   - Added prominent **❤️ Like Count** column to [OfficialDashboardPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialDashboardPage.jsx) so officials see citizen priority.
   - Enabled column sorting by `like_count`, `created_at`, `title`, `category`, and `status`.

6. **Mobile-First Responsiveness & Express API Protection**:
   - Optimized container padding and form filter controls for mobile screen widths (`360px`, `375px`, `390px`, `412px`).
   - Added in-memory IP rate limiting (10 requests/min) and payload size checks to [server/routes/analyzeReport.js](file:///d:/Git/public-infra-system/server/routes/analyzeReport.js).

---

## Files Modified & Created

### New Files Created
- [src/features/settings/api.js](file:///d:/Git/public-infra-system/src/features/settings/api.js) — App settings API module.
- [src/lib/geofence.js](file:///d:/Git/public-infra-system/src/lib/geofence.js) — Haversine distance & geofence validation utility.
- [src/routes/guards/ApprovalGuard.jsx](file:///d:/Git/public-infra-system/src/routes/guards/ApprovalGuard.jsx) — User approval route guard.
- [src/features/auth/WaitingApprovalPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/WaitingApprovalPage.jsx) — Waiting for approval page with WhatsApp request.

### Files Modified
- [src/hooks/useAuth.js](file:///d:/Git/public-infra-system/src/hooks/useAuth.js) — Added `approvalStatus`, `isApproved`, `isPending`, `isRejected`.
- [src/routes/index.jsx](file:///d:/Git/public-infra-system/src/routes/index.jsx) — Added `/waiting-approval` route and `ApprovalGuard`.
- [src/features/auth/LoginPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/LoginPage.jsx) — Role & approval based login redirection.
- [src/features/auth/SignupPage.jsx](file:///d:/Git/public-infra-system/src/features/auth/SignupPage.jsx) — New citizen redirect to `/waiting-approval`.
- [src/features/admin/api.js](file:///d:/Git/public-infra-system/src/features/admin/api.js) — Sorting, pagination, and `updateUserApprovalStatus`.
- [src/features/admin/AdminUsersPage.jsx](file:///d:/Git/public-infra-system/src/features/admin/AdminUsersPage.jsx) — Two-tab interface, user approval controls, admin self-protection, and system settings form.
- [src/features/officialDashboard/api.js](file:///d:/Git/public-infra-system/src/features/officialDashboard/api.js) — Column sorting and custom pagination.
- [src/features/officialDashboard/OfficialDashboardPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialDashboardPage.jsx) — Interactive sorting, 10 items/page pagination, and prominent Likes display.
- [src/features/reportSubmission/ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) — Geofence boundary validation before report submission.
- [src/components/layout/AppShell.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppShell.jsx) — Mobile overflow protection & responsive container padding.
- [src/features/feed/FeedPage.jsx](file:///d:/Git/public-infra-system/src/features/feed/FeedPage.jsx) — Mobile filter select layout optimization.
- [server/routes/analyzeReport.js](file:///d:/Git/public-infra-system/server/routes/analyzeReport.js) — Rate limiting (10 req/min/IP) and payload size limit.

---

## Database Changes & SQL Migrations
- Migration `004_approval_and_settings.sql` (added `users.approval_status`, `public.app_settings`, and `enforce_role_change_admin_only` trigger) was executed in Supabase by the user.

---

## Verification Steps for User

1. **Build Check**:
   Execute in terminal:
   ```bash
   npm run build
   ```
2. **Approval Flow Testing**:
   - Register a new citizen account → confirm redirect to `/waiting-approval`.
   - Click **Ask Permission via WhatsApp** → confirm WhatsApp deep link.
   - Log in as Admin (`samjoshua.paldwin@gmail.com`) → navigate to `/admin` → approve the citizen.
3. **Table Sorting & Pagination Testing**:
   - Test sorting columns (Likes, Date, Name) on Admin and Official tables.
4. **Geofence Testing**:
   - Configure Geofence center & radius in Admin Settings -> System Settings tab.
   - Submit a report outside the allowed radius to verify distance blocking.
