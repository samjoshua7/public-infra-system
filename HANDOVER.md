# HANDOVER.md — Privacy Lock (Account-Wide & Per-Post Anonymity)

## Objective
Implement an end-to-end **Privacy Lock** system allowing citizens to submit and maintain civic issue reports anonymously without fear of harassment, threats, or retaliation.
1. **Funny Pseudonym System**: Auto-generate unique animal aliases (e.g. `LongGiraffe421`, `SwiftFox302`) in PostgreSQL and assign them to existing and future users.
2. **Account-Wide Privacy Lock**: Setting in `/profile` allowing citizens to anonymize all their past and future reports globally.
3. **Per-Post Privacy Lock**: Setting in `/report/new` allowing citizens to publish specific sensitive issues anonymously.
4. **Absolute Anonymity Guarantee**: Non-authors (including government officials and super admins) cannot view the author's real name, email, or user profile link. Data is sanitized at both the database RPC level (`get_nearby_reports`) and UI level.
5. **Author Continuity**: The author viewing their own report can still see their identity and manage their report, with an indicator showing their public pseudonym.

---

## Decisions Made
1. **PostgreSQL-Enforced Anonymity**:
   - Rather than relying solely on frontend masking, `get_nearby_reports` RPC masks `reporter_name`, nullifies `reporter_email`, and returns `reporter_id = null` over the wire when `privacy_lock` is active and `auth.uid() <> r.reporter_id`. Even network payload inspection cannot expose the whistleblower.
2. **Funny Dummy Aliases**:
   - Combinations of 20 humorous adjectives and 20 animals with a 3-digit suffix (e.g., `LongGiraffe421`, `CleverPenguin102`).
   - Trigger `handle_new_user()` auto-assigns aliases upon signup.
3. **Dual Scope (Account-Wide + Per-Post)**:
   - Account-level lock stored in `public.users.privacy_lock`.
   - Post-level lock stored in `public.issue_reports.privacy_lock`.
   - A report is treated as anonymous if either flag is true.
4. **Protected Profile Guard**:
   - Visiting `/profile/:id` of a privacy-locked citizen blocks the report list and displays a privacy shield banner.

---

## Files Modified & Created
- [supabase/migrations/010_privacy_lock.sql](file:///d:/Git/public-infra-system/supabase/migrations/010_privacy_lock.sql) *(NEW)*: Adds `anonymous_name` and `privacy_lock` columns, generator function, trigger update, and RPC privacy masking.
- [src/lib/privacyUtils.js](file:///d:/Git/public-infra-system/src/lib/privacyUtils.js) *(NEW)*: Identity resolution helper `getPrivacyDisplay()` and dummy name generator.
- [src/lib/dbCapabilities.js](file:///d:/Git/public-infra-system/src/lib/dbCapabilities.js) *(MODIFY)*: Added `hasPrivacyLockColumn` capability flag.
- [src/features/profile/api.js](file:///d:/Git/public-infra-system/src/features/profile/api.js) *(NEW)*: `getUserProfileById` and `updateAccountPrivacyLock`.
- [src/features/profile/ProfilePage.jsx](file:///d:/Git/public-infra-system/src/features/profile/ProfilePage.jsx) *(MODIFY)*: Displays dummy alias, account-wide privacy lock switch, and private profile shield guard.
- [src/features/reportSubmission/api.js](file:///d:/Git/public-infra-system/src/features/reportSubmission/api.js) *(MODIFY)*: `createIssueReport` accepts and stores `privacy_lock`.
- [src/features/reportSubmission/ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) *(MODIFY)*: Manages `privacyLock` state and passes to submission API.
- [src/features/reportSubmission/components/PhotoCaptureStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/PhotoCaptureStep.jsx) *(MODIFY)*: Added Privacy Lock checkbox with dummy alias preview.
- [src/features/reportSubmission/components/AutoFillReviewStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/AutoFillReviewStep.jsx) *(MODIFY)*: Added Privacy Lock review panel.
- [src/features/feed/api.js](file:///d:/Git/public-infra-system/src/features/feed/api.js) *(MODIFY)*: Mapped `privacy_lock` and `anonymous_name` from RPC and `listReports`.
- [src/features/feed/components/ReportCard.jsx](file:///d:/Git/public-infra-system/src/features/feed/components/ReportCard.jsx) *(MODIFY)*: Uses `getPrivacyDisplay()` to mask author names and disable profile links for non-authors.
- [src/features/reportDetail/api.js](file:///d:/Git/public-infra-system/src/features/reportDetail/api.js) *(MODIFY)*: `getReportDetail` selects `privacy_lock` and `anonymous_name`. `updateReportDetails` supports editing `privacy_lock`.
- [src/features/reportDetail/components/ReportDetailContent.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/ReportDetailContent.jsx) *(MODIFY)*: Header renders dummy alias and privacy status.
- [src/features/reportDetail/components/EditReportDialog.jsx](file:///d:/Git/public-infra-system/src/features/reportDetail/components/EditReportDialog.jsx) *(MODIFY)*: Allows toggling Privacy Lock on existing reports.
- [src/features/feed/demoReports.js](file:///d:/Git/public-infra-system/src/features/feed/demoReports.js) *(MODIFY)*: Added demo aliases and privacy lock flags.

---

## Database Changes & SQL Migrations
- **Executed Migration**: `supabase/migrations/010_privacy_lock.sql` (Confirmed executed in Supabase).
- **Columns Added**:
  - `public.users.anonymous_name (text)`
  - `public.users.privacy_lock (boolean, default false)`
  - `public.issue_reports.privacy_lock (boolean, default false)`
- **Functions Created/Updated**:
  - `public.generate_anonymous_name()`
  - `public.handle_new_user()`
  - `public.get_nearby_reports(...)`

---

## APIs Changed
- `updateAccountPrivacyLock(userId, isLocked)` in `src/features/profile/api.js`.
- `createIssueReport({ ..., privacyLock })` in `src/features/reportSubmission/api.js`.
- `updateReportDetails(reportId, { ..., privacy_lock })` in `src/features/reportDetail/api.js`.
- `get_nearby_reports` RPC returns `privacy_lock` and `anonymous_name`.

---

## Remaining TODOs (Priority Order)
1. **Live Browser Verification**:
   - Open `/profile` and verify assigned alias (e.g. `🦒 LongGiraffe421`).
   - Toggle Account-Wide Privacy Lock and verify toast notification.
   - Submit a report at `/report/new` with Privacy Lock enabled.
   - In Incognito / logged out, verify the report shows `🦒 LongGiraffe421` with profile links disabled and no email visible.
2. **Address Column Sync (Optional Quick Action)**:
   - Run `alter table public.issue_reports add column if not exists address text;` in Supabase SQL editor if not already executed to enable full reverse-geocoded address persistence.

---

## Known Risks
- If a user toggles Privacy Lock off, past reports that were created with per-post privacy lock remaining true will still be protected (by design).

---

## Exact Next Task for Following Coding Agent
- Continue Phase 2 official workflows or Phase 3 map visualization according to project roadmaps.
