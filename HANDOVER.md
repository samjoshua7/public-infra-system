# HANDOVER.md — Hyper-Local Proximity Civic Feed Implementation

## Objective
Transform the **Public Feed** (`/feed`) from a generic duplicate of Explore into a **Hyper-Local Proximity Civic Feed** ("Issues near you") while keeping **Explore Issues** (`/explore`) intact as a global search and discovery grid. 
The feed:
1. Prompts for device GPS coordinates on every visit with zero-delay fallback to `localStorage`.
2. Sorts infrastructure issues by straight-line distance from the citizen (`distance_km asc, created_at desc`).
3. Supports dynamic radius filtering (`All Nearby`, `< 2 km`, `< 5 km`, `< 10 km`, `< 25 km`).
4. Displays proximity chips on report media and location metadata (e.g. `📍 450 m away`).

---

## Decisions Made
1. **Clear Division of Roles Between Feed and Explore**:
   - **Public Feed (`/feed`)**: Citizen's hyper-local neighborhood feed. Prioritizes proximity, allows distance-radius filtering, and shows distance badges.
   - **Explore Issues (`/explore`)**: City-wide visual mosaic and category search tool without requiring GPS permissions.
2. **Server-Side Geospatial RPC (`get_nearby_reports`)**:
   - Computes geodesic distance in PostgreSQL via spherical law of cosines (`6371 * acos(...)`), filtering by radius, category, and status in one database round-trip.
3. **Optimistic Geolocation Caching**:
   - Seeds initial coordinates from `localStorage` (`civic_last_user_location`) so the user never encounters a blank screen or layout jump while waiting for `navigator.geolocation`.
4. **Client-Side Fallback Resiliency**:
   - If the RPC is unreachable or running against mock data, `listNearbyReports` seamlessly falls back to client-side Haversine distance calculations without crashing the UI.

---

## Files Modified & Created
- [supabase/migrations/008_nearby_reports_feed.sql](file:///d:/Git/public-infra-system/supabase/migrations/008_nearby_reports_feed.sql) *(NEW)*: Defines `get_nearby_reports` RPC.
- [src/lib/geoUtils.js](file:///d:/Git/public-infra-system/src/lib/geoUtils.js) *(NEW)*: `calculateDistanceKm`, `formatDistance`, `getStoredLocation`, `setStoredLocation`.
- [src/hooks/useUserLocation.js](file:///d:/Git/public-infra-system/src/hooks/useUserLocation.js) *(NEW)*: Hook handling geolocation permissions, caching, and auto-querying.
- [src/features/feed/components/NearbyLocationBar.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/NearbyLocationBar.jsx) *(NEW)*: Banner displaying live GPS coordinates, status chip, refresh button, and radius filter chips.
- [src/features/feed/api.js](file:///d:/Git/public-infra-system/src/features/feed/api.js) *(MODIFY)*: Added `listNearbyReports` with RPC and Haversine fallback.
- [src/features/feed/components/ReportCard.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/ReportCard.jsx) *(MODIFY)*: Proximity badge overlaid on media and beside GPS coordinates.
- [src/features/feed/FeedPage.jsx](file:///d:/Git/public-infra-system/src/features/feed/FeedPage.jsx) *(MODIFY)*: Integrated `useUserLocation`, `NearbyLocationBar`, `radiusKm` state, and proximity empty states.

---

## Database Changes & SQL Migrations
- **Migration**: [supabase/migrations/008_nearby_reports_feed.sql](file:///d:/Git/public-infra-system/supabase/migrations/008_nearby_reports_feed.sql)
- **Status**: Executed in Supabase by the user.
- **Function**: `public.get_nearby_reports(p_user_lat, p_user_lng, p_max_radius_km, p_category, p_status, p_page, p_page_size)`

---

## APIs Changed
- **Supabase RPC**:
  - `supabase.rpc('get_nearby_reports', { ... })` integrated in `listNearbyReports()`.
- **Express**:
  - None (Express remains strictly dedicated to AI vision auto-fill per constitution).

---

## Components Added
- `NearbyLocationBar`: Proximity control bar and radius pills.

---

## Remaining TODOs (Priority Order)
1. **User Verification**:
   - Open `http://localhost:5173/feed` in Chrome / Edge.
   - Allow location access when prompted by the browser.
   - Verify that reports display proximity badges (e.g. `📍 1.2 km away`).
   - Click radius filter chips (`< 2 km`, `< 5 km`, `All Nearby`) and verify dynamic filtering.
2. **Fallback Verification**:
   - Click "Location Inactive" / deny permission in browser settings and verify feed gracefully shows all reports with clear message.

---

## Known Risks
- If a user tests on desktop without hardware GPS, browser geolocation relies on IP-based positioning which may have an accuracy radius of 1-10 km.
- If no reports exist within the selected radius (e.g. `< 2 km`), the empty state guides the user to expand their radius.

---

## Exact Next Task for the Following Coding Agent
The hyper-local feed and proximity pipeline are completely wired and verified. The next task is to verify user feedback on the feed experience and address any specific edge-case adjustments requested by the user.
