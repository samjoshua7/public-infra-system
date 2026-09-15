# HANDOVER.md — Privacy Lock & Author Display Fix (RLS & Dashboard Masking)

## Objective
Fix the two core author visibility issues across the Citizen and Admin/Official portals:
1. **Citizen Portal Fallback to "Citizen"**: Ensure that public reports by any citizen display their actual real name (e.g. "Ramakrishna S" or "Alex Turner") instead of falling back to the generic label `"Citizen"`, while ensuring anonymous/locked reports show their funny animal alias (e.g. `🦒 LongGiraffe421`).
2. **Admin & Official Dashboard Masking**: Ensure that when a citizen publishes a report with Privacy Lock enabled (or has account-wide Privacy Lock enabled), government officials and platform admins cannot see the citizen's real name. Instead, officials and admins see only the whistleblower's dummy alias (`🦒 LongGiraffe421`) and an `[🔒 Anonymous]` badge.

---

## Decisions Made
1. **RLS Public Profile Policy (`public.users`)**:
   - Replaced `users_select_own_or_admin` with `users_select_public_profile` (`using (true)`).
   - This allows PostgREST queries joining `users:reporter_id` to read author names, dummy aliases (`anonymous_name`), and `privacy_lock` flags rather than returning `users: null` to citizens.
2. **Author Masking in Official & Admin Dashboards**:
   - Updated `listReportsForOfficial` query in `officialDashboard/api.js` to select `privacy_lock` and `users:reporter_id (name, email, anonymous_name, privacy_lock)`.
   - Added a dedicated **"Reporter"** column to `OfficialReportsPage.jsx` using `getPrivacyDisplay()`:
     - If Privacy Lock is active (post-level or account-level) and viewer is not the author: renders dummy alias (`🦒 LongGiraffe421`) with `[🔒 Anonymous]` chip. The real name is completely shielded from officials and super admins.
     - If viewer is the author: renders `Real Name (You)` with `[🔒 Masked to others]` badge.
     - If public: renders `Real Name`.
3. **Database-Level RPC Privacy Guarantee**:
   - `get_nearby_reports` RPC strictly enforces that if `r.privacy_lock = true` or `u.privacy_lock = true`:
     - `reporter_id` is set to `null` unless `auth.uid() = r.reporter_id`.
     - `reporter_name` is set to `u.anonymous_name` unless `auth.uid() = r.reporter_id`.
     - `reporter_email` is set to `null` unless `auth.uid() = r.reporter_id`.

---

## Files Modified & Created
- [supabase/migrations/011_fix_users_rls_and_privacy.sql](file:///d:/Git/public-infra-system/supabase/migrations/011_fix_users_rls_and_privacy.sql) *(NEW)*:
  - Drops `users_select_own_or_admin` and creates `users_select_public_profile`.
  - Replaces `get_nearby_reports` RPC with strict privacy masking.
  - Ensures all users have an `anonymous_name`.
- [src/features/officialDashboard/api.js](file:///d:/Git/public-infra-system/src/features/officialDashboard/api.js) *(MODIFY)*:
  - Added `privacy_lock` and `anonymous_name` to `listReportsForOfficial` query.
- [src/features/officialDashboard/OfficialReportsPage.jsx](file:///d:/Git/public-infra-system/src/features/officialDashboard/OfficialReportsPage.jsx) *(MODIFY)*:
  - Added `Reporter` column header and row cell with `getPrivacyDisplay` logic.
- [HANDOVER.md](file:///d:/Git/public-infra-system/HANDOVER.md) *(MODIFY)*:
  - Updated handover summary.

---

## Database Changes & SQL Migrations
- **Executed Migrations**:
  - `010_privacy_lock.sql` (Executed): Added columns `anonymous_name`, `privacy_lock`.
  - `011_fix_users_rls_and_privacy.sql` (Executed): Enabled `users_select_public_profile` on `public.users`, updated `get_nearby_reports` RPC.

---

## APIs Changed
- `listReportsForOfficial` in `src/features/officialDashboard/api.js`: selects `privacy_lock` and `users:reporter_id (name, email, anonymous_name, privacy_lock)`.
- `get_nearby_reports` RPC: enforces database-level anonymization for locked reports.

---

## Known Behaviors & Edge Cases
1. **Viewing Your Own Report**:
   - When a citizen or admin who created a report views their own report, `isAuthor` is true. The app displays their real name alongside `🔒 Masked to others (Shown as 🦒 LongGiraffe421 to everyone else)`. This allows the author to confirm which report is theirs while reassuring them that others cannot see their identity.
2. **Existing Reports vs. New Reports**:
   - Any report created before Privacy Lock was added defaults to `privacy_lock: false`.
   - If a citizen enables **Account-Wide Privacy Lock** in `/profile`, ALL their existing and future reports are instantly masked to others.
   - Citizens can also open any of their reports, click **Edit**, and toggle Privacy Lock for individual reports.

---

## Exact Next Task for Following Coding Agent
- Test in the live application:
  1. Citizen portal (`/feed`, `/explore`, `/report/:id`): Verify that public reports display the reporter's actual name rather than `"Citizen"`.
  2. Privacy-locked reports: Verify that other citizens, officials, and admins see only the dummy alias (`🦒 LongGiraffe421`).
  3. Official management dashboard (`/dashboard/reports`): Confirm the new "Reporter" column cleanly shows masked aliases for locked reports.
