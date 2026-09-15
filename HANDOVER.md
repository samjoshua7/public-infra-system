# HANDOVER.md — Real GPS Satellite Map & Auto Address Geocoding

## Objective
Introduce real GPS satellite mapping with a draggable location pin and automated reverse geocoding of street addresses during civic issue reporting:
1. **Auto Address Geocoding**: Automatically resolve device coordinates into real human-readable street, neighbourhood, and town addresses (e.g. *"Tiruchendur Main Rd, Palayamkottai, Tirunelveli"*) using OpenStreetMap Nominatim.
2. **Interactive Satellite Map Picker ([SatelliteLocationPicker.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/SatelliteLocationPicker.jsx))**: High-resolution Esri World Imagery satellite layer with street toggle and draggable marker pin (`[ Show Map ]`). Allows citizens to adjust their location if indoors or if GPS is inaccurate.
3. **Database & API Integration**: Added `address text` column to `public.issue_reports` and updated `get_nearby_reports` RPC.
4. **Display Real Addresses**: Render street addresses in place of raw GPS numbers in Public Feed report cards and Instagram-style report detail dialogs.
5. **Resilient Schema Support & Zero-Crash Architecture**: Added `dbCapabilities` helper to prevent 400 Bad Request / code `42703` errors before the Supabase SQL migration is executed.

---

## Decisions Made
1. **Free, Keyless Satellite Imagery**:
   - Integrated Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`) via Leaflet. High-resolution global satellite photos without requiring API keys or paid tiers.
   - Provided an inline switcher to OpenStreetMap standard street tiles.
2. **Reverse Geocoding with In-Memory Caching**:
   - Added `reverseGeocode(latitude, longitude)` in `geoUtils.js` with a precision-keyed Map cache to avoid redundant requests.
   - Extracts road, suburb, and municipality for a concise civic address.
3. **Collapsible Map in Report Form**:
   - Per the Constitution UI/UX Rule ("The report flow must stay as short as possible"), the map is collapsible via a clean `[ Show Map 🛰️ ]` / `[ Hide Map ]` toggle. Citizens standing next to a problem submit instantly, while citizens needing fine-tuning can expand the map with one click.
4. **Dual Pin Repositioning**:
   - Citizens can both drag the pin and click anywhere on the satellite imagery to instantly jump the pin, updating coordinates and address simultaneously.
5. **Handling Unmigrated Databases (Code `42703`)**:
   - Built [dbCapabilities.js](file:///d:/Git/public-infra-system/src/lib/dbCapabilities.js) to keep track of database schema migration status.
   - By default, `hasAddressColumn` is `false` until verified or until migration is executed, preventing PostgREST from failing with `column issue_reports.address does not exist` (400 Bad Request).
   - Once migration is applied or reports with addresses are submitted, `hasAddressColumn` is enabled and persisted in localStorage.

---

## Files Modified & Created
- [supabase/migrations/009_report_address.sql](file:///d:/Git/public-infra-system/supabase/migrations/009_report_address.sql) *(NEW)*: Adds `address text` column and updates `get_nearby_reports` RPC.
- [src/lib/dbCapabilities.js](file:///d:/Git/public-infra-system/src/lib/dbCapabilities.js) *(NEW)*: Schema capability tracker to eliminate 400/42703 errors.
- [index.html](file:///d:/Git/public-infra-system/index.html) *(MODIFY)*: Added Leaflet 1.9.4 CSS and JS CDN links.
- [src/lib/geoUtils.js](file:///d:/Git/public-infra-system/src/lib/geoUtils.js) *(MODIFY)*: Added `reverseGeocode` function.
- [src/features/reportSubmission/components/SatelliteLocationPicker.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/SatelliteLocationPicker.jsx) *(NEW)*: Leaflet satellite map with draggable pin marker and layer toggle.
- [src/features/reportSubmission/components/PhotoCaptureStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/PhotoCaptureStep.jsx) *(MODIFY)*: Display address, `[ Show Map ]` toggle, and embedded satellite picker.
- [src/features/reportSubmission/ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) *(MODIFY)*: State management for address and custom coordinates from map dragging.
- [src/features/reportSubmission/components/AutoFillReviewStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/AutoFillReviewStep.jsx) *(MODIFY)*: Location Address review field.
- [src/features/reportSubmission/api.js](file:///d:/Git/public-infra-system/src/features/reportSubmission/api.js) *(MODIFY)*: `createIssueReport` accepts and stores `address` with resilient fallback.
- [src/features/feed/api.js](file:///d:/Git/public-infra-system/src/features/feed/api.js) *(MODIFY)*: `listReports` selects `address` conditionally via `dbCapabilities`.
- [src/features/reportDetail/api.js](file:///d:/Git/public-infra-system/src/features/reportDetail/api.js) *(MODIFY)*: `getReportDetail` selects `address` conditionally via `dbCapabilities`.
- [src/features/feed/components/ReportCard.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/ReportCard.jsx) *(MODIFY)*: Displays friendly street address in feed cards.
- [src/features/reportDetail/components/ReportDetailContent.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/ReportDetailContent.jsx) *(MODIFY)*: Displays friendly street address in report detail view.
- [src/features/feed/demoReports.js](file:///d:/Git/public-infra-system/src/features/feed/demoReports.js) *(MODIFY)*: Added demo addresses.

---

## Database Changes & SQL Migrations
- **Migration**: [supabase/migrations/009_report_address.sql](file:///d:/Git/public-infra-system/supabase/migrations/009_report_address.sql)
- **Status**: SQL migration file ready. Must be executed in Supabase SQL Editor:
  ```sql
  -- 1. Add human-readable address column to issue_reports
  alter table public.issue_reports
    add column if not exists address text;

  -- 2. Update get_nearby_reports RPC to return the address column
  drop function if exists public.get_nearby_reports;

  create or replace function public.get_nearby_reports(
    p_user_lat numeric default null,
    p_user_lng numeric default null,
    p_max_radius_km numeric default null,
    p_category text default null,
    p_status text default null,
    p_page int default 1,
    p_page_size int default 10
  )
  returns table (
    report_id uuid,
    reporter_id uuid,
    photo_url text,
    title text,
    description text,
    category text,
    latitude numeric,
    longitude numeric,
    address text,
    status text,
    is_hidden boolean,
    like_count int,
    comment_count int,
    created_at timestamptz,
    reporter_name text,
    reporter_email text,
    distance_km numeric,
    total_count bigint
  )
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    v_offset int := greatest(0, (coalesce(p_page, 1) - 1) * coalesce(p_page_size, 10));
    v_role text := public.current_user_role();
    v_has_coords boolean := (p_user_lat is not null and p_user_lng is not null);
  begin
    return query
    with calculated as (
      select
        r.report_id,
        r.reporter_id,
        r.photo_url,
        r.title,
        r.description,
        r.category,
        r.latitude,
        r.longitude,
        r.address,
        r.status,
        r.is_hidden,
        r.like_count,
        r.comment_count,
        r.created_at,
        coalesce(u.name, 'Citizen') as reporter_name,
        u.email as reporter_email,
        case
          when v_has_coords then
            round(
              (6371 * acos(
                least(1.0, greatest(-1.0,
                  cos(radians(p_user_lat)) * cos(radians(r.latitude)) *
                  cos(radians(r.longitude) - radians(p_user_lng)) +
                  sin(radians(p_user_lat)) * sin(radians(r.latitude))
                ))
              ))::numeric,
              2
            )
          else null
        end as distance_km
      from public.issue_reports r
      left join public.users u on u.id = r.reporter_id
      where (
        (r.is_hidden = false or r.reporter_id = auth.uid() or v_role in ('GOVERNMENT_OFFICIAL', 'ADMIN'))
      )
      and (p_category is null or p_category = 'all' or r.category = p_category)
      and (p_status is null or p_status = 'all' or r.status = p_status)
    ),
    filtered as (
      select *
      from calculated
      where (
        not v_has_coords
        or p_max_radius_km is null
        or p_max_radius_km <= 0
        or (distance_km is not null and distance_km <= p_max_radius_km)
      )
    ),
    counted as (
      select count(*) as full_count from filtered
    )
    select
      f.report_id,
      f.reporter_id,
      f.photo_url,
      f.title,
      f.description,
      f.category,
      f.latitude,
      f.longitude,
      f.address,
      f.status,
      f.is_hidden,
      f.like_count,
      f.comment_count,
      f.created_at,
      f.reporter_name,
      f.reporter_email,
      f.distance_km,
      coalesce(c.full_count, 0::bigint) as total_count
    from filtered f
    cross join counted c
    order by
      case when v_has_coords then f.distance_km end asc nulls last,
      f.created_at desc
    limit coalesce(p_page_size, 10)
    offset v_offset;
  end;
  $$;
  ```

---

## Exact Next Task for Following Coding Agent
1. Wait for citizen confirmation that SQL migration `009_report_address.sql` has been run in Supabase.
2. Once confirmed, address persistence is fully active.
