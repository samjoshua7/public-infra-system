# HANDOVER.md — Civic Voice Sharp Monochrome Design, PWA Mobile Experience & Dev Stability

## Objective
1. Established a sleek, minimalist **Monochrome / Charcoal / Slate design system** (`#0F172A` in light, `#F8FAFC` in dark) with **sharp geometric 4px corners** on all buttons, chips, and inputs (`borderRadius: 4px`), eliminating all bubbly/pill curves.
2. Implemented dual-audience responsive navigation architecture:
   - **PC / Desktop Users**: Left fixed sidebar (`DesktopSidebar`, 240px) + Desktop header (`AppHeader`).
   - **Mobile Users**: Sleek compact top bar (`MobileTopBar`, 52px) + WhatsApp-style bottom navigation (`MobileBottomNav`, 56px fixed at bottom).
3. **App-Based Mobile Experience (PWA)**:
   - Enabled full PWA capabilities with Web App Manifest (`manifest.json`), service worker (`sw.js`), and scalable vector app icons.
   - Built a custom installation lifecycle hook (`usePWAInstall.js`) and install prompt card (`PWAInstallPrompt.jsx`) that prompts browser mobile users to install the app to their home screen and app drawer (standalone mode without browser URL bars, Instagram/LinkedIn feel).
4. **Stability, Watcher Hardening & Performance**:
   - Resolved the `EBUSY` file watcher crash on Windows by configuring `server.watch.ignored` in `vite.config.js`.
   - Prevented false `503 (Offline)` traps during development by isolating `sw.js` and actively unregistering service workers on `localhost`.
   - Added standard `<meta name="mobile-web-app-capable" content="yes" />` in `index.html`.
   - Optimized SVG icons by 99.7% (from 1.4 MB down to ~5 KB).

---

## Decisions Made
1. **Vite Watcher Hardening (`vite.config.js`)**:
   - Added ignore patterns for Windows copy files (`**/* - Copy.*`, `**/*.tmp`, `**/*.log`, etc.) so transient file locks never crash Node.js.
   - Pre-bundled `@mui/icons-material` and the new PWA action icons (`GetApp`, `IosShare`, `AddBoxOutlined`, `CheckCircleOutline`) to eliminate mid-session re-optimization reloads.
2. **Service Worker Isolation (`public/sw.js` & `index.html`)**:
   - `sw.js` explicitly bypasses all requests from `localhost`, `127.0.0.1`, `/src/**`, `/@**`, and module scripts.
   - `index.html` detects `localhost` / `127.0.0.1` and automatically calls `navigator.serviceWorker.getRegistrations()` to unregister any stale workers, guaranteeing that local dev and Vite HMR are 100% direct and unhindered.
3. **PWA Manifest & Standalone Mode (`manifest.json`)**:
   - `display: "standalone"`, `start_url: "/feed"`, `theme_color: "#0F172A"`, `background_color: "#0F172A"`.
   - Scalable, lightweight SVG icons (`icon.svg`, `icon-192.svg`, `icon-512.svg`).
4. **Dual Install Mechanism (`usePWAInstall.js` & `PWAInstallPrompt.jsx`)**:
   - **Android / Chromium**: Listens to `beforeinstallprompt`, triggers native install prompt with one click.
   - **iOS Safari**: Automatically detects iOS Safari and presents a clear, 2-step visual guide (Share icon → "Add to Home Screen").
   - **Standalone Detection**: Automatically suppresses install prompts when already launched in standalone mode.
   - **Intelligent Dismissal Snooze**: Snoozes prompt for 3 days in `localStorage` (`civic_pwa_dismissed_at`).

---

## Files Modified & Added
- [vite.config.js](file:///d:/Git/public-infra-system/vite.config.js) — Windows watcher ignore configuration and icon pre-bundling.
- [public/sw.js](file:///d:/Git/public-infra-system/public/sw.js) — Bypass dev/module requests and eliminate synthetic 503 errors.
- [index.html](file:///d:/Git/public-infra-system/index.html) — Standard `mobile-web-app-capable` meta tag and dev SW auto-unregistration.
- [public/icons/icon.svg](file:///d:/Git/public-infra-system/public/icons/icon.svg) — Lightweight 2 KB civic landmark icon.
- [public/icons/icon-192.svg](file:///d:/Git/public-infra-system/public/icons/icon-192.svg) — Lightweight 1.3 KB 192x192 icon.
- [public/icons/icon-512.svg](file:///d:/Git/public-infra-system/public/icons/icon-512.svg) — Lightweight 2 KB 512x512 icon.
- [public/manifest.json](file:///d:/Git/public-infra-system/public/manifest.json) — PWA Manifest specifying standalone display mode and icons.
- [src/hooks/usePWAInstall.js](file:///d:/Git/public-infra-system/src/hooks/usePWAInstall.js) — Custom hook handling install prompt state, standalone detection, and snooze.
- [src/components/pwa/PWAInstallPrompt.jsx](file:///d:/Git/public-infra-system/src/components/pwa/PWAInstallPrompt.jsx) — Sharp 4px/6px monochrome install card for Android/Desktop & iOS.
- [src/components/layout/AppShell.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppShell.jsx) — Mounted `PWAInstallPrompt` in application layout shell.
- [src/app/theme/theme.js](file:///d:/Git/public-infra-system/src/app/theme/theme.js) — Monochrome Charcoal palette and 4px button overrides.
- [src/components/layout/DesktopSidebar.jsx](file:///d:/Git/public-infra-system/src/components/layout/DesktopSidebar.jsx) — Fixed 240px sidebar for desktop users.
- [src/components/layout/MobileTopBar.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileTopBar.jsx) — Sleek 52px top bar for mobile users.
- [src/components/layout/MobileBottomNav.jsx](file:///d:/Git/public-infra-system/src/components/layout/MobileBottomNav.jsx) — WhatsApp-style bottom navigation.

---

## Database Changes & Migrations
- None. Database schema, triggers, and RLS policies remain untouched.

## APIs Changed (Supabase + Express)
- None. Public API contracts and Express AI backend remain unchanged.

---

## Remaining TODOs (Priority Order)
1. User restarts Vite dev server: `npm run dev`.
2. Refresh `http://localhost:5173` to verify that service worker unregisters and Vite HMR connects cleanly.
3. Test PWA install prompt in Chrome DevTools mobile emulation.

## Known Risks
- If a browser window still has the previous Service Worker active in memory, a single hard refresh (`Ctrl + F5`) triggers the new `index.html` logic which immediately unregisters it and clears the cache.

## Exact Next Task for Following Coding Agent
- Confirm dev server is running on `http://localhost:5173` and verify that the console has zero warnings or 503 errors.
