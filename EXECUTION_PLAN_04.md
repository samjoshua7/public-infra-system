# EXECUTION_PLAN_04.md — Access Control, Tables, Officials & Mobile

Implement the following enhancements to the existing CivicSpeak application.

**IMPORTANT:** Do not rebuild or replace existing functionality. Inspect the current codebase first and make minimal targeted changes. Reuse existing components, APIs, Supabase logic, roles, and styling.

---

## 0. EXISTING DATABASE FOUNDATION — DO NOT DUPLICATE

`004_approval_and_settings.sql` already exists and provides the required database foundation.

It already contains:

* `users.approval_status` → `pending | approved | rejected`
* New normal citizens default to `pending`
* Existing Admin and Government Official bootstrap accounts are approved
* `app_settings` singleton table
* `whatsapp_number`
* `geofence_center_lat`
* `geofence_center_lng`
* `geofence_radius_km`
* Admin-only settings update policy
* Database-level protection preventing modification of the ADMIN account's role/approval status

**Do NOT create another migration for these features.**

Reuse the existing fields/functions/policies.

Only create another migration if inspection proves something genuinely required is missing.

---

# 1. ALL TABLES — PAGINATION + SORTING

Audit the entire webapp for every data table, including:

* Super Admin user table
* Government Official report table
* Any other existing data tables

Every applicable table must have:

### Pagination

* Default 10 rows/page.
* Previous/Next.
* First/Last where appropriate.
* Current page indicator.
* Reset to page 1 when sort changes.

### Column sorting

Clicking a sortable column header must sort by that column.

Behavior:

```text
First click  → ascending
Second click → descending
```

Show a clear visual sort indicator such as:

```text
Name ↑
Name ↓
```

Do not make Actions/image columns sortable.

If a reusable table component already exists, enhance it instead of creating duplicates.

Keep loading, empty, and error states intact.

---

# 2. CITIZEN APPROVAL ACCESS

New citizen accounts must not immediately enter the application.

Flow:

```text
Login/Register
    ↓
Read users.approval_status
    ↓
approved?
 ┌───────┴───────┐
 YES             NO
 ↓                ↓
Enter App    Waiting for Approval
                  ↓
             Ask Permission
                  ↓
               WhatsApp
                  ↓
             Admin approves
                  ↓
              Enter App
```

## Backend enforcement

This MUST be enforced server-side/API-side, not only through React routing.

Rules:

```text
ADMIN                  → allowed
GOVERNMENT_OFFICIAL    → allowed
CITIZEN + approved     → allowed
CITIZEN + pending      → blocked
CITIZEN + rejected     → blocked
```

A pending/rejected citizen must not bypass access by:

* manually entering URLs
* modifying localStorage/state
* directly calling protected APIs

Return `403` with a useful machine-readable code such as:

```json
{ "code": "USER_PENDING_APPROVAL" }
```

Use the existing authentication/authorization architecture.

---

# 3. WAITING FOR APPROVAL PAGE

Create/reuse:

```text
/waiting-approval
```

Show a clear message:

```text
Your account is waiting for approval.

CivicSpeak is currently operating with controlled access.
Please contact the administrator to request access.
```

Add:

```text
[ Ask Permission ]
```

Do not make this look like an application error.

---

# 4. WHATSAPP PERMISSION REQUEST

Use the existing:

```text
app_settings.whatsapp_number
```

Do NOT hard-code the phone number.

Clicking **Ask Permission** should open WhatsApp with the configured number and this exact default message:

```text
Hey, I want to use CivicSpeak!
```

Use a WhatsApp deep link.

If no number is configured, show a graceful message instead of generating a broken link.

---

# 5. SUPER ADMIN SETTINGS

Extend the existing Super Admin settings page to control:

```text
WhatsApp Access Request Number
Geofence Center Latitude
Geofence Center Longitude
Allowed Radius (km)
```

These map directly to the existing `app_settings` fields:

```text
whatsapp_number
geofence_center_lat
geofence_center_lng
geofence_radius_km
```

Do not create another settings table.

Only ADMIN can update these settings.

---

# 6. SUPER ADMIN — APPROVE / REJECT USERS

Enhance the existing Super Admin user-management UI.

Show:

```text
Approval Status
```

For pending citizens provide:

```text
[ Approve ] [ Reject ]
```

Approve:

```text
approval_status = approved
```

Reject:

```text
approval_status = rejected
```

Use the existing `users.approval_status` field.

Only ADMIN may perform approval/rejection.

Do not create a second approval system.

---

# 7. GEOFENCE / LOCKED RADIUS

The app will be deployed publicly on Vercel, so the configured radius must be enforced server-side.

Use:

```text
geofence_center_lat
geofence_center_lng
geofence_radius_km
```

Citizen flow:

```text
Browser gets location
        ↓
Send latitude/longitude to backend
        ↓
Backend reads app_settings
        ↓
Calculate distance
        ↓
Inside radius → continue
Outside radius → block
```

Use a standard distance calculation such as Haversine.

**Never trust a frontend boolean such as `insideRadius: true`.**

Browser location is an additional restriction, not a replacement for authentication/approval/authorization.

If location permission is denied, show a clear message and do not crash.

---

# 8. GOVERNMENT OFFICIAL — REPORT STATUS

Government officials must be able to manage the status of reports.

First inspect the existing report schema/status implementation.

**Reuse the existing status field if one already exists.**

Do not create duplicate status columns.

If no status workflow exists, use the existing project's appropriate equivalent of:

```text
Submitted
Under Review
In Progress
Resolved
Rejected
```

Officials should be able to select/change the report status from their dashboard.

Only:

```text
GOVERNMENT_OFFICIAL
ADMIN
```

may update report status.

Citizens must never be able to modify report status through the API.

---

# 9. REPORT IMPORTANCE — LIKES

Officials must clearly see the existing citizen like count for each report.

Example:

```text
Pothole near Main Road
❤️ 42 likes
Status: Under Review
```

Likes represent the importance signal.

**Do not create another independent importance system.**

Use the existing likes data.

Officials should be able to identify highly-liked/high-priority reports and update their status accordingly.

---

# 10. STATUS REFLECTS TO CITIZENS

Officials and citizens must use the same report status stored in the database.

Example:

```text
Official changes:
Under Review → In Progress
```

Citizens viewing that report must see:

```text
Status: In Progress
```

Do not maintain separate citizen/official statuses.

---

# 11. SUPER ADMIN SELF-PROTECTION

The existing `004_approval_and_settings.sql` already protects the ADMIN row at database level.

Now update the existing Super Admin user-edit UI so the currently logged-in Super Admin cannot:

* delete themselves
* deactivate themselves
* change their own role
* remove their own ADMIN privileges
* modify their own protected approval status

Disable/hide those dangerous controls when editing the current Super Admin.

**Do not create another SQL protection mechanism unless the existing one is actually missing/broken.**

Backend/API protection must remain intact as well.

---

# 12. ROLE-BASED LOGIN REDIRECTION

After authentication, determine the authoritative role from the existing user/profile system.

Redirect immediately:

```text
CITIZEN
    → Citizen application/dashboard

GOVERNMENT_OFFICIAL
    → Official dashboard

ADMIN
    → Super Admin dashboard
```

Do not use localStorage as the authoritative role.

Also prevent users from manually navigating into unauthorized role-specific pages.

Existing authentication and role logic must be preserved.

---

# 13. MOBILE-FIRST CITIZEN EXPERIENCE

**VERY IMPORTANT**

Citizens are the primary users and approximately 95% are expected to use mobile devices.

Optimize the citizen-facing application for mobile.

**Do NOT convert the entire webapp into mobile view.**

Keep:

```text
Citizens
→ mobile-first/responsive

Government Officials
→ existing desktop/web experience

Super Admin
→ existing desktop/web experience
```

---

## Citizen UI to optimize

Inspect and improve responsiveness for:

* Login/Register
* Home/dashboard
* Report submission
* Camera/photo capture
* Image preview
* AI Fill-Up
* Report review
* Report listing
* Report details
* Likes
* Profile
* Waiting for Approval
* Navigation
* Dialogs/forms

Target common widths:

```text
360px
375px
390px
412px
```

Prevent:

* horizontal overflow
* clipped buttons
* broken forms
* oversized desktop components
* broken images
* tiny touch targets
* content extending outside viewport

Prefer vertical layouts for mobile forms.

---

## Citizen report lists

If a citizen-facing table exists, do not force a desktop-width table onto mobile.

Use responsive cards where appropriate.

Example:

```text
┌─────────────────────────┐
│ Pothole near Main Road  │
│ Road Damage             │
│ ❤️ 42 likes             │
│ Under Review            │
│ [ View Report ]         │
└─────────────────────────┘
```

Official/Admin tables should remain desktop-oriented.

Do not redesign the entire application.

---

# 14. API RATE LIMITING

Because the application will be publicly deployed on Vercel, inspect the existing API architecture and add reasonable protection to expensive/high-risk endpoints.

Prioritize:

```text
AI analysis
Report submission
Authentication
Likes
Approval/Admin actions
```

The AI endpoint must not be callable by:

```text
unauthenticated users
pending citizens
rejected citizens
```

Approved citizens may use it subject to rate limits.

Reject unnecessarily large request/image payloads where appropriate.

Do not introduce an entirely new backend architecture.

---

# 15. IMPLEMENTATION RULES

* Reuse existing code and components.
* Do not rewrite working features.
* Do not duplicate database fields/tables.
* Do not duplicate authentication or role systems.
* Do not duplicate report status or likes systems.
* Keep Admin/Official desktop UI intact.
* Prioritize citizen mobile responsiveness.
* Enforce security server-side, not just in React.
* Avoid excessive console/debug logging.
* Preserve all functionality from previous execution plans.

---

# 16. IMPLEMENTATION ORDER

```text
1. Inspect existing architecture + migration 004
2. Add table pagination/sorting
3. Implement approval enforcement
4. Add waiting-for-approval page
5. Add WhatsApp permission request
6. Add Super Admin approval controls
7. Connect Super Admin settings
8. Implement server-side geofence
9. Add official report status management
10. Show report likes to officials
11. Protect Super Admin self-editing
12. Fix role-based login redirects
13. Optimize citizen mobile UI
14. Add/verify API rate limiting
15. Run existing production build
16. Update HANDOVER.md
```

---

# 17. IMPORTANT — TESTING

**Do NOT spend execution time performing manual application testing.**

The user will personally test the application after implementation.

Only ensure the code/build is not obviously broken and fix compilation/build errors caused by your changes.

Do not create lengthy testing reports.

At completion, provide a short implementation summary only.

---

# 18. DEFINITION OF DONE

* All applicable tables have pagination.
* Sortable table headers support ascending/descending sorting.
* New citizens are `pending`.
* Pending/rejected citizens cannot access protected APIs.
* Waiting-for-approval page works.
* WhatsApp permission request uses the configured Admin number.
* Admin can approve/reject citizens.
* Existing geofence settings are functional and validated server-side.
* Officials can see likes and change report status.
* Citizens see the same updated report status.
* Super Admin cannot self-delete/self-demote.
* Admin and Official login redirects work correctly.
* Unauthorized role access remains blocked.
* Citizen UI is properly mobile responsive.
* Official/Admin desktop UI remains intact.
* High-risk APIs have reasonable protection.
* Existing functionality is preserved.
* Build succeeds.
* `HANDOVER.md` is updated.

**Do not create unnecessary files or architecture. Implement the features directly in the existing project.**