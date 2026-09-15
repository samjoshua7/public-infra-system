# HANDOVER.md — Native Desktop & Mobile PWA Push Notification Engine

## Objective
Enable native operating system push notifications (Windows Action Center toasts, Android notification shade, Chrome PWA banners) for desktop and mobile devices alongside the existing in-app notification engine.

---

## Decisions Made
1. **Hybrid Native Notification Dispatcher (`src/lib/nativeNotifications.js`)**:
   - Primary: Uses `navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options))` — required for Android Chrome and installed Chrome PWAs.
   - Fallback: Uses desktop `new Notification(title, options)` with `onclick` focus handler.
   - Rich OS Options: Includes app badge and icon (`/icons/icon-192.png`), vibration pattern `[200, 100, 200]`, custom tags to prevent duplicate spam, and `data.url` pointing to `/report/:id`.
2. **Service Worker Navigation & Click Routing (`public/sw.js`)**:
   - Added `notificationclick` listener: closes the notification, matches existing open windows/tabs and navigates to the target URL, or opens a new window if none are active.
   - Added `push` listener for future external VAPID background payloads.
3. **Local Dev & Production SW Registration (`index.html`)**:
   - Enabled `navigator.serviceWorker.register('/sw.js')` on window load across both local dev and production. The service worker already bypasses all dev, HMR, and Vite requests so offline caching traps are prevented while notification capabilities are fully available.
4. **Automatic Prompt On Every Reload (`PushPermissionBanner.jsx` & `NotificationProvider.jsx`)**:
   - The app now automatically prompts the browser for notification permission on every reload as long as permission has not yet been decided (`default`).
   - Removed all `localStorage` dismissal persistence. On every reload, the user is presented with the prompt to either Accept or Reject.
   - Built dual activation: immediate trigger on mount + fallback user-interaction listener so modern browser gesture restrictions are seamlessly handled.
   - Added explicit Accept and Reject controls with live status chips.

---

## Files Modified & Created
- [public/sw.js](file:///d:/Git/public-infra-system/public/sw.js) *(MODIFY)*: Added `notificationclick` and `push` event listeners.
- [index.html](file:///d:/Git/public-infra-system/index.html) *(MODIFY)*: Enabled clean service worker registration on load.
- [src/lib/nativeNotifications.js](file:///d:/Git/public-infra-system/src/lib/nativeNotifications.js) *(NEW)*: Native notification dispatcher and permission manager.
- [src/app/providers/NotificationProvider.jsx](file:///d:/Git/public-infra-system/src/app/providers/NotificationProvider.jsx) *(MODIFY)*: Dispatches native push notifications on Realtime events and provides permission context.
- [src/components/notifications/PushPermissionBanner.jsx](file:///d:/Git/public-infra-system/src/components/notifications/PushPermissionBanner.jsx) *(NEW)*: Civic permission request prompt.
- [src/components/layout/AppShell.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppShell.jsx) *(MODIFY)*: Embedded `PushPermissionBanner`.
- [src/features/notifications/NotificationsPage.jsx](file:///d:/Git/public-infra-system/src/features/notifications/NotificationsPage.jsx) *(MODIFY)*: Integrated push permission status badge and action button.

---

## Database Changes & Migrations
- None (builds directly on `007_notifications_system.sql` and Supabase Realtime).

---

## APIs Changed
- Client-side only.

---

## Remaining TODOs (Priority Order)
1. **Smoke Test Native Windows / Chrome OS Notification**:
   - Open app on `http://localhost:5173`.
   - Click "Enable Alerts" on the prompt banner -> click "Allow" on Chrome's native prompt.
   - Minimize the browser or switch to another window.
   - In another browser / tab, trigger any event (e.g. submit report or update status).
   - Verify Windows Action Center toast appears in bottom-right corner with sound and Civic Voice icon.
   - Click the toast -> verify it brings Chrome to focus and opens the report.

---

## Known Risks
- If a user explicitly blocks notifications in Chrome site settings (`chrome://settings/content/notifications`), the browser will not show the prompt again; the UI gracefully indicates `OS Alerts: Blocked`.
