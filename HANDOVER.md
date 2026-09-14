# HANDOVER.md — Civic Voice Sharp Monochrome Design & Progressive Web App (PWA) Mobile Experience

## Objective
1. Established a sleek, minimalist **Monochrome / Charcoal / Slate design system** (`#0F172A` in light, `#F8FAFC` in dark) with **sharp geometric 4px corners** on all buttons, chips, and inputs (`borderRadius: 4px`), eliminating all bubbly/pill curves.
2. Implemented dual-audience responsive navigation architecture:
   - **PC / Desktop Users**: Left fixed sidebar (`DesktopSidebar`, 240px) + Desktop header (`AppHeader`).
   - **Mobile Users**: Sleek compact top bar (`MobileTopBar`, 52px) + WhatsApp-style bottom navigation (`MobileBottomNav`, 56px fixed at bottom).
3. **App-Based Mobile Experience (PWA)**:
   - Enabled full PWA capabilities with Web App Manifest (`manifest.json`), service worker (`sw.js`), and scalable vector app icons.
   - Built a custom installation lifecycle hook (`usePWAInstall.js`) and install prompt card (`PWAInstallPrompt.jsx`) that prompts browser mobile users to install the app to their home screen and app drawer (standalone mode without browser URL bars, Instagram/LinkedIn feel).

---

## Decisions Made
1. **PWA Manifest & Standalone Mode (`manifest.json`)**:
   - `display: "standalone"`, `start_url: "/feed"`, `theme_color: "#0F172A"`, `background_color: "#0F172A"`.
   - Scalable SVG icons with maskable support (`icon-192.svg`, `icon-512.svg`, `icon.svg`).
2. **Service Worker (`sw.js`)**:
   - Network-first strategy for static app shell caching.
   - Explicit bypass for Supabase API (`supabase.co`) and Express AI backend (`:5000`) so dynamic data and AI calls are never cached stale.
3. **Dual Install Mechanism (`usePWAInstall.js` & `PWAInstallPrompt.jsx`)**:
   - **Android / Chromium**: Listens to `beforeinstallprompt`, triggers native install prompt with one click, updates to standalone state when `appinstalled` fires.
   - **iOS Safari**: Automatically detects iOS Safari and presents a clear, 2-step visual guide (Share icon → "Add to Home Screen").
   - **Standalone Detection**: `window.matchMedia('(display-mode: standalone)').matches` or `window.navigator.standalone === true`; automatically suppresses install prompts when already launched as an app.
   - **Intelligent Dismissal Snooze**: When dismissed via "Not now" or "X", snoozes prompt for 3 days in `localStorage` (`civic_pwa_dismissed_at`).
4. **Layout Placement**:
   - On mobile (`xs`, `sm`), the install prompt is fixed at `bottom: 68px`, cleanly clearing the 56px WhatsApp-style `MobileBottomNav`.
   - On desktop (`md`+), floats unobtrusively at `bottom: 24px, right: 24px`.
   - Adheres strictly to the sharp 4px/6px monochrome palette.

---

## Files Modified & Added
- [public/manifest.json](file:///d:/Git/public-infra-system/public/manifest.json) — PWA Manifest specifying standalone display mode and icons.
- [public/sw.js](file:///d:/Git/public-infra-system/public/sw.js) — Service worker caching app shell and bypassing API calls.
- [public/icons/icon.svg](file:///d:/Git/public-infra-system/public/icons/icon.svg) — Civic landmark app icon.
- [public/icons/icon-192.svg](file:///d:/Git/public-infra-system/public/icons/icon-192.svg) — 192x192 app icon.
- [public/icons/icon-512.svg](file:///d:/Git/public-infra-system/public/icons/icon-512.svg) — 512x512 app icon.
- [index.html](file:///d:/Git/public-infra-system/index.html) — Manifest link, iOS apple-mobile-web-app tags, service worker registration script.
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
1. In physical Android device or Chrome DevTools Application tab, test `beforeinstallprompt` simulation.
2. In iOS Safari on a mobile device, verify that the 2-step "Add to Home Screen" instructions display clearly.
3. Test offline behavior in service worker when disconnected from WiFi.

## Known Risks
- On Chrome Desktop, `beforeinstallprompt` only fires if the site passes PWA installability criteria (manifest + service worker with fetch handler), which are now both satisfied.
- In Incognito / Private browsing modes, browsers typically do not fire `beforeinstallprompt`.

## Exact Next Task for Following Coding Agent
- Open Chrome DevTools -> Application tab -> Manifest & Service Workers to inspect the active service worker status and test triggering the install banner.
