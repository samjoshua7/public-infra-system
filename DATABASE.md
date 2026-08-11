# Database Specification

This document defines the database contract for the Public Infrastructure Reporting and Tracking System. It is intentionally documentation-only at this stage and should be treated as the source of truth for future schema and migration work.

## 1. Database Philosophy

The database is the authoritative system for report data, status pipeline state, and authorization. The frontend is a client of the database and must never be treated as the source of truth for a report's status, like count, or comment count. The Express AI service is stateless with respect to report data — it only produces suggested field values that the citizen confirms, after which persistence goes through Supabase.

The design favors clarity over over-engineering. The system targets a public civic reporting workload and should remain simple to operate and maintain.

## 2. Core Principles

- Use PostgreSQL with Supabase.
- Use UUID primary keys for user-facing business entities where practical.
- Every business table includes created_at and updated_at timestamps.
- Maintain auditability of status changes through a dedicated status-history table, not just a mutable status column.
- Use Row Level Security to enforce access at the database layer, keyed on role (CITIZEN, GOVERNMENT_OFFICIAL, ADMIN).

## 3. ER Diagram

```text
users ─< issue_reports (reporter)
users ─< report_status_history (changed_by)
users ─< report_likes
users ─< report_comments

issue_reports ─< report_status_history
issue_reports ─< report_likes
issue_reports ─< report_comments
issue_reports ─< report_media (if multiple photos supported later; v1 = single photo on issue_reports)
```

## 4. Core Tables

### users

Mirror the Supabase auth.users record with additional application-level metadata.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, references auth.users.id |
| role | text | CITIZEN, GOVERNMENT_OFFICIAL, or ADMIN |
| name | text | Display name |
| email | text | Email address |
| active | boolean | Active state |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

New signups default to CITIZEN. GOVERNMENT_OFFICIAL and ADMIN are assigned manually by an admin, not selectable at signup.

### issue_reports

| Column | Type | Notes |
|---|---|---|
| report_id | uuid | Primary key |
| reporter_id | uuid | References users.id |
| photo_url | text | Supabase Storage object reference, required |
| title | text | Required; AI-suggested, citizen-editable |
| description | text | Required; AI-suggested, citizen-editable |
| category | text | e.g. pothole, streetlight, traffic_light, garbage, other; AI-suggested, citizen-editable |
| latitude | numeric(9,6) | Required, captured via browser Geolocation API at submission time |
| longitude | numeric(9,6) | Required, captured via browser Geolocation API at submission time |
| status | text | posted, action_taken, fixed — denormalized current value, authoritative history lives in report_status_history |
| like_count | integer | Denormalized cache, default 0, maintained by trigger |
| comment_count | integer | Denormalized cache, default 0, maintained by trigger |
| created_at | timestamptz | Default now() — also serves as the report date/time |
| updated_at | timestamptz | Default now() |

### report_status_history

| Column | Type | Notes |
|---|---|---|
| history_id | uuid | Primary key |
| report_id | uuid | References issue_reports.report_id |
| status | text | posted, action_taken, or fixed |
| changed_by | uuid | References users.id; must be GOVERNMENT_OFFICIAL or ADMIN, enforced in RLS |
| note | text | Nullable, optional official comment on the status change |
| created_at | timestamptz | Default now() |

### report_likes

| Column | Type | Notes |
|---|---|---|
| report_id | uuid | References issue_reports.report_id |
| user_id | uuid | References users.id |
| created_at | timestamptz | Default now() |

Primary key is the (report_id, user_id) composite — a user can like a given report at most once.

### report_comments

| Column | Type | Notes |
|---|---|---|
| comment_id | uuid | Primary key |
| report_id | uuid | References issue_reports.report_id |
| user_id | uuid | References users.id |
| body | text | Required |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

## 5. Relationships

- One user (CITIZEN) may report many issue_reports.
- One issue_report has exactly one current status, but many rows in report_status_history over its lifetime.
- One issue_report may have many likes (at most one per user) and many comments.
- report_status_history is the source of truth for the status pipeline; issue_reports.status is a denormalized convenience column kept in sync by trigger.

## 6. Enums and Controlled Values

Use text columns with explicit validation rules rather than custom enum types unless the team later adopts a migration workflow that supports them comfortably.

Suggested values:

- user role: CITIZEN, GOVERNMENT_OFFICIAL, ADMIN
- report status: posted, action_taken, fixed
- report category: pothole, streetlight, traffic_light, garbage, other (extend as needed)

## 7. Indexes

Recommended indexes:

- issue_reports(status, created_at)
- issue_reports(category, created_at)
- issue_reports(reporter_id)
- issue_reports(latitude, longitude) — for future map/area queries
- report_status_history(report_id, created_at)
- report_likes(report_id)
- report_comments(report_id, created_at)

## 8. Constraints

- latitude and longitude must be present on every issue_report — a report cannot be created without geolocation.
- status must be one of the controlled values, and (in the first implementation) can only move forward: posted → action_taken → fixed.
- A like is unique per (report_id, user_id).
- A report cannot be hard-deleted by a CITIZEN; only ADMIN can remove/moderate a report, and removal should be a status/flag rather than deletion where possible, to preserve the audit trail.

## 9. Triggers and Derived Data

The following should be enforced through database triggers or stored functions:

- Insert a report_status_history row whenever issue_reports.status changes, and keep issue_reports.status in sync with the latest history row.
- Update issue_reports.like_count when report_likes rows are inserted/deleted.
- Update issue_reports.comment_count when report_comments rows are inserted/deleted.
- Prevent a status update that isn't performed by a GOVERNMENT_OFFICIAL or ADMIN (defense in depth alongside RLS).

## 10. Views

Recommended read-only views for Phase 3:

- reports_by_category_summary
- reports_by_status_summary
- avg_resolution_time (created_at of "posted" to created_at of "fixed" in report_status_history)
- reports_by_area (grouped/bucketed by lat/long for map summaries)

These views are informational and should not be used as the primary write path.

## 11. Functions

Suggested server-side functions:

- update_report_status(report_id, new_status, note) — validates the role of the caller and the allowed transition, then writes history and updates the denormalized status
- recalculate_like_count(report_id)
- recalculate_comment_count(report_id)

These functions should remain simple and explicit. Avoid over-abstracting them.

## 12. RLS Philosophy

Row Level Security must protect user-facing tables according to role. The database should enforce the same rules the application expects.

The implementation should follow this three-tier pattern:

- ADMIN: full access, including user/role management and moderation
- GOVERNMENT_OFFICIAL: read all reports and full detail; insert into report_status_history / update issue_reports.status; no delete on reports, no user management
- CITIZEN: insert their own issue_reports; read all issue_reports (public feed); insert their own likes/comments; update/delete only their own comments; cannot change status

Tables without public relevance (e.g. any future internal moderation notes) should be restricted by default and not exposed to the CITIZEN role.

## 13. Audit Logging

The system should preserve enough information to understand who changed what and when. For the initial implementation, this can be done through:

- created_at and updated_at columns,
- report_status_history as the authoritative audit trail for the status pipeline,
- and a later extension to a dedicated moderation/audit table if stronger traceability is needed for admin actions (e.g. report removal).

## 14. Soft Delete and Moderation Strategy

- Do not hard-delete a report as the default moderation action; prefer a moderation status/flag so the record and its history remain intact.
- If hard deletion is ever required (e.g. legal takedown), it should be an explicit ADMIN-only action, documented when implemented.

## 15. Photo Storage

- Report photos are stored in Supabase Storage, not in the database itself; issue_reports.photo_url stores the storage reference.
- Storage policies should allow authenticated users to upload their own report photos and allow public read access for feed display (or signed URLs, if the team later decides photos should not be fully public).

## 16. Migration Order

The recommended migration order is:

1. base tables: users, issue_reports,
2. supporting tables: report_status_history, report_likes, report_comments,
3. triggers and derived value functions (status history sync, like/comment count caches),
4. RLS policies,
5. reporting views (Phase 3).

## 17. Future Scalability

The current design is sufficient for an initial single-region civic reporting rollout. Future growth should be handled through:

- geospatial indexing (PostGIS) if area/proximity queries become a core feature,
- dedicated moderation/audit tables,
- notification tables (status-change subscriptions),
- and multi-department routing if reports need to be assigned to specific government departments.
