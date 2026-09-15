# HANDOVER.md — Real-Time Civic Notification Engine & Navigation Badges

## Objective
Implement a multi-tier, real-time civic notification system across the application adhering to the Database-First Rule and zero-Express-bloat architecture:
1. **New Post Broadcast**: Notify all active approved citizens whenever a new civic report is submitted.
2. **Status Pipeline Updates**: When an official/admin updates report status (`budget_allocated`, `on_process`, `finished`), notify users who liked the report with the text `"[Title] is under [Status]"` and subtext `"The post you liked got updated"`, plus notify the original reporter with subtext `"Your reported issue was updated"`.
3. **Admin User Approval**: Notify citizens when their registration moves from `pending` to `approved`.
4. **Realtime Delivery & Badges**: Live Supabase Realtime synchronization, animated in-app toast alerts, unread counters on desktop sidebar, mobile bottom navigation, and top headers, and a revamped `/notifications` activity center.

---

## Decisions Made
1. **Authoritative Database Triggers**:
   - Implemented 3 PostgreSQL `SECURITY DEFINER` triggers (`trg_notify_new_report`, `trg_notify_status_change`, `trg_notify_user_approval`) so notifications are dispatched authoritatively at the database layer without relying on client-side state.
2. **Supabase Realtime**:
   - Added `public.notifications` to `supabase_realtime` publication.
   - `NotificationProvider` listens to `INSERT`, `UPDATE`, and `DELETE` filtered by `user_id=eq.${user.id}`, providing instantaneous toast popups and badge increments without polling.
3. **User Engagement Subtexts**:
   - Stored dedicated `subtext` column on `notifications` table to cleanly communicate context:
     - Likers: `"The post you liked got updated"`
     - Reporter: `"Your reported issue was updated"`
     - Community: `"In your community"`
4. **Comprehensive UI Indicators**:
   - Activity links in `DesktopSidebar`, `MobileBottomNav`, `AppHeader`, and `MobileTopBar` equipped with MUI `Badge` displaying live `unreadCount`.
5. **Activity Center Overhaul**:
   - Replaced mock activity synthesis in `NotificationsPage.jsx` with real database queries, category filter tabs ("All", "Status Updates", "New Reports", "Account"), "Mark all as read", and interactive preview via `ReportDetailDialog`.

---

## Files Modified & Created
- [supabase/migrations/007_notifications_system.sql](file:///d:/Git/public-infra-system/supabase/migrations/007_notifications_system.sql) *(NEW)*: Created `public.notifications`, RLS policies, trigger functions, and realtime publication.
- [src/features/notifications/api.js](file:///d:/Git/public-infra-system/src/features/notifications/api.js) *(NEW)*: Supabase query client for paginated notifications, unread counts, mark-as-read, mark-all-read, and delete.
- [src/app/providers/NotificationProvider.jsx](file:///d:/Git/public-infra-system/src/app/providers/NotificationProvider.jsx) *(NEW)*: Realtime subscription listener, unread count manager, and global in-app alert toast.
- [src/hooks/useNotifications.js](file:///d:/Git/public-infra-system/src/hooks/useNotifications.js) *(NEW)*: React hook for notification context.
- [src/app/App.jsx](file:///d:/Git/public-infra-system/src/app/App.jsx) *(MODIFY)*: Wrapped application routes with `NotificationProvider`.
- [src/components/layout/DesktopSidebar.jsx](file:///d:/Git/public-infra-system/src/components/layout/DesktopSidebar.jsx) *(MODIFY)*: Added unread badge to "Activity" nav item.
- [src/components/layout/MobileBottomNav.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileBottomNav.jsx) *(MODIFY)*: Added unread badge to mobile bottom "Activity" tab.
- [src/components/layout/AppHeader.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppHeader.jsx) *(MODIFY)*: Added quick-access notification bell with unread badge on desktop.
- [src/components/layout/MobileTopBar.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileTopBar.jsx) *(MODIFY)*: Added notification bell with unread badge on mobile top bar.
- [src/features/notifications/NotificationsPage.jsx](file:///d:/Git/public-infra-system/src/features/notifications/NotificationsPage.jsx) *(MODIFY)*: Revamped UI with real data, filter tabs, mark-all-read, visual subtext pills, and report modal viewer.

---

## Database Changes & SQL Migrations
- **Executed**:
  - `007_notifications_system.sql` (Executed by user in Supabase).
- **Pending**:
  - None.

---

## APIs Changed (Supabase + Express)
- **Supabase Client**:
  - `listNotifications`: Queries `public.notifications` joined with `issue_reports`.
  - `getUnreadNotificationsCount`: Exact count on `notifications` where `read = false`.
  - `markNotificationAsRead`: Updates single row `read = true`.
  - `markAllNotificationsAsRead`: Bulk updates all unread rows `read = true`.
  - `deleteNotification`: Deletes row from `notifications`.
- **Express Backend**:
  - Unchanged (retains pure AI auto-fill focus per constitution).

---

## Components Added / Updated
- `NotificationProvider`: Context & Realtime listener + Toast alert.
- `NotificationsPage`: Filterable civic activity center.
- `DesktopSidebar`, `MobileBottomNav`, `AppHeader`, `MobileTopBar`: Dynamic badge integrations.

---

## Remaining TODOs (Priority Order)
1. **Manual Smoke Testing**:
   - Post a report as Citizen A -> Check Citizen B's realtime toast and badge.
   - Like a report as Citizen B -> Official advances status with note -> Verify Citizen B's notification reads `"[Title] is under [Status]"` with `"The post you liked got updated"`.
   - Admin approves pending user -> Verify `"Account Approved!"` notification.
2. **Production Build Confirmation**:
   - Run `npm run build` in terminal to confirm bundle cleanliness.

---

## Known Risks
- None. All triggers are `SECURITY DEFINER` and handle null notes and self-reporting cleanly.

---

## Exact Next Task for Following Coding Agent
- Conduct smoke testing in browser across 2 accounts (Citizen and Official/Admin) to verify real-time trigger deliveries in local dev server.
