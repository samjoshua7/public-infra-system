# HANDOVER.md — Department-Based Access Control for Government Officials

## Objective
Implement category/department-based access control for government officials:
1. **Department Assignment**: Platform administrators can assign municipal officials specific department categories (e.g., `pothole`, `streetlight`, `traffic_light`, `garbage`, `other`) or designate them as a "Super Official" assigned to all departments (`all`).
2. **Authorized Status Pipeline**: Officials can view reports across the city for civic awareness, but can only advance status (`ordered` → `budget_allocated` → `on_process` → `finished`) on reports belonging to their assigned departments.
3. **Database-Level Enforcement**: The `update_report_status()` RPC securely checks the invoking official's `assigned_departments` before allowing state transitions.
4. **Official Dashboard Scoping**: Officials can easily filter reports and statistics by their assigned departments or view citywide records.

---

## Decisions Made
1. **Database Schema (`public.users.assigned_departments text[]`)**:
   - Stored directly in `public.users` as a `text[]` array. Defaults to `'{}'`.
   - Super officials have `'all'` in their `assigned_departments` array.
   - Admins bypass department checks completely.
   - Migration `013_department_assignment.sql` backfilled existing officials and admins with `'{all}'`.
2. **Authoritative RPC Transition Guard**:
   - `update_report_status()` RPC queries the caller's role and `assigned_departments`.
   - Rejects updates with descriptive SQL exceptions if an official attempts to modify a report outside their assigned categories or has no departments assigned.
3. **Admin User Management UI (`AdminUsersPage.jsx`)**:
   - Added a dedicated **Department** column to the Admin user registry table.
   - For `CITIZEN`: Displays `—`.
   - For `ADMIN`: Displays `All Departments` badge.
   - For `GOVERNMENT_OFFICIAL`: Displays an interactive multi-select dropdown with checkbox items:
     - `⭐ All Departments (Super Official)` (`all`)
     - `Pothole`, `Streetlight`, `Traffic Light`, `Garbage`, `Other`
   - Toggling "All Departments" auto-deselects individual categories, and vice versa.
   - When promoting a citizen to official, defaults `assigned_departments` to `['all']`.
4. **Official Dashboard & Reports Page UI**:
   - **Scope Indicator**: Displays the logged-in official's assigned departments at the top of `/dashboard/reports`.
   - **Department Filter**: Dropdown allows filtering by "All Categories", "🎯 My Assigned Depts Only", or individual categories.
   - **Action Gating**:
     - Advance status button is disabled for reports outside the official's assigned departments with a tooltip: `Restricted: Only officials in [Department] can advance status`.
     - In `QuickAdvanceDialog` and `StatusUpdateControl`: Validates department permissions and renders a read-only alert when viewing out-of-scope issues.
5. **Dashboard Analytics Scoping**:
   - Added a `Citywide` vs `My Department` toggle to `OfficialDashboardPage.jsx` so officials can toggle metrics between citywide and department-specific counts.

---

## Files Modified & Created
- [supabase/migrations/013_department_assignment.sql](file:///d:/Git/public-infra-system/supabase/migrations/013_department_assignment.sql) *(NEW)*:
  - Added `assigned_departments text[]` column to `public.users`.
  - Updated `update_report_status()` RPC to validate caller department scope.
- [src/features/admin/api.js](file:///d:/Git/public-infra-system/src/features/admin/api.js) *(MODIFY)*:
  - Added `assigned_departments` to `listUsers`, `updateUserRole`, and `updateUserApprovalStatus` selects.
  - Added `updateUserDepartments(userId, departments)` API call.
- [src/features/admin/AdminUsersPage.jsx](file:///d:/Git/public-infra-system/src/features/admin/AdminUsersPage.jsx) *(MODIFY)*:
  - Added `Department` column in TableHead and interactive multi-select in TableBody.
  - Added `handleDepartmentChange` with toggle rules for `'all'`.
- [src/hooks/useAuth.js](file:///d:/Git/public-infra-system/src/hooks/useAuth.js) *(MODIFY)*:
  - Exposed `assignedDepartments` from `profile.assigned_departments`.
- [src/hooks/usePermissions.js](file:///d:/Git/public-infra-system/src/hooks/usePermissions.js) *(MODIFY)*:
  - Added `isSuperOfficial`, `assignedDepartments`, and `canManageCategory(category)` helper.
- [src/features/officialDashboard/api.js](file:///d:/Git/public-infra-system/src/features/officialDashboard/api.js) *(MODIFY)*:
  - Updated `listReportsForOfficial` to accept `category` and `assignedDepartments` for scoping.
  - Updated `getDashboardStats` to accept `assignedDepartments` for filtered metrics.
- [src/features/officialDashboard/OfficialReportsPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialReportsPage.jsx) *(MODIFY)*:
  - Added scope chips, category filter dropdown, and restricted action buttons for out-of-scope reports.
- [src/features/officialDashboard/components/QuickAdvanceDialog.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/QuickAdvanceDialog.jsx) *(MODIFY)*:
  - Added frontend check against `canManageCategory(report.category)`.
- [src/features/officialDashboard/components/StatusUpdateControl.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/components/StatusUpdateControl.jsx) *(MODIFY)*:
  - Added `category` prop and out-of-scope informational alert.
- [src/features/reportDetail/components/ReportDetailContent.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/ReportDetailContent.jsx) *(MODIFY)*:
  - Passed `category={report.category}` to `StatusUpdateControl`.
- [src/features/officialDashboard/OfficialDashboardPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialDashboardPage.jsx) *(MODIFY)*:
  - Added toggle button group for Citywide vs My Department metrics.

---

## Database Changes & SQL Migrations
- **Executed Migrations**:
  - `013_department_assignment.sql` (Executed): Added `assigned_departments text[]` on `public.users`, backfilled existing officials/admins with `'{all}'`, updated `update_report_status()` RPC.

---

## APIs Changed
- `listUsers`, `updateUserRole`, `updateUserApprovalStatus`: queries now return `assigned_departments`.
- `updateUserDepartments(userId, departments)`: newly added Supabase update helper in `src/features/admin/api.js`.
- `listReportsForOfficial({ status, category, assignedDepartments, ... })`: enhanced with category & department filtering.
- `getDashboardStats(assignedDepartments)`: enhanced with department filter.
- `update_report_status` RPC: now enforces department permission check in PostgreSQL.

---

## Known Risks & Edge Cases
1. **Empty Assigned Departments**:
   - If an official has `assigned_departments = '{}'`, they can view reports but cannot advance status on any report (they are read-only). The database RPC will throw: `Officials without assigned departments cannot update report status`.
2. **Report Category Changes**:
   - If a citizen edits their report's category before an official takes action, the report moves under the jurisdiction of the official assigned to the new category.

---

## Remaining TODOs (Priority Order)
1. Verify department assignment in Admin panel (`/admin/users`).
2. Log in as an official with a specific department (e.g. `pothole`) and verify that:
   - Pothole reports have active status advance buttons.
   - Non-pothole reports have disabled status advance buttons with tooltips.
   - Status updates for out-of-scope reports are rejected both in the UI and at the database RPC level.
3. Verify "Super Official" (`all`) can manage all reports across any department.

---

## Exact Next Task for Following Coding Agent
- Test the flow in the browser:
  1. Open `/admin/users`, change an official's department assignment to `['streetlight']`.
  2. Switch to that official account and visit `/dashboard/reports`.
  3. Verify that streetlight reports can be advanced, while pothole and garbage reports show the restricted tooltip.
