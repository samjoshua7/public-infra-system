# HANDOVER.md — Public Infrastructure Reporting and Tracking System

## Objective
Establish the project documentation baseline (AGENTS, ARCHITECTURE, DATABASE, ROADMAP) for the Public Infrastructure Reporting and Tracking System, replacing the previous printing-press ERP documentation that was carried over from the old project. No application code has been written yet — this handover marks the end of Phase 0 (documentation/foundation) and the starting point for Phase 1 implementation.

---

## Decisions Made
1. **Stack**: React + Vite + Material UI on the frontend, Supabase (Auth + Postgres + Storage + RLS) as the primary backend, Vercel for frontend hosting.
2. **Express backend, scoped narrowly**: A standalone Express server is used *only* to call the AI vision API for photo auto-fill (title/description/category), since that call requires a provider API key that cannot be exposed in the browser. Express does not duplicate Supabase's role for auth/CRUD/storage. Hosting provider for Express is not yet decided.
3. **Geolocation**: Captured via the browser Geolocation API at the moment of report submission, not derived from photo EXIF data. Submission is blocked if permission is denied.
4. **Roles**: CITIZEN (default on signup), GOVERNMENT_OFFICIAL, ADMIN — assigned manually by an admin, not self-selected.
5. **Status pipeline**: Fixed forward pipeline posted → action_taken → fixed, authoritative in a report_status_history table, with issue_reports.status kept as a denormalized/synced convenience column.

---

## Files Modified / Created
- `AGENTS.md` (REWRITTEN — was printing-press ERP constitution, now civic reporting constitution)
- `ARCHITECTURE.md` (REWRITTEN — was printing-press architecture, now civic reporting architecture with Express AI service)
- `DATABASE.md` (REWRITTEN — was printing-press schema, now issue_reports/status-history/likes/comments schema)
- `ROADMAP.md` (REWRITTEN — was printing-press phase plan, now civic reporting phase plan)
- `HANDOVER.md` (this file — reset to reflect the new project; previous content described completed printing-press ERP work and no longer applies)
- `README.md` (not yet updated — still generic placeholder text, should be filled in during Phase 1)

---

## Database Changes & SQL Migrations
None executed yet. No migrations exist in this repository. DATABASE.md section 16 defines the recommended migration order:
1. base tables (users, issue_reports)
2. supporting tables (report_status_history, report_likes, report_comments)
3. triggers (status history sync, like/comment count caches)
4. RLS policies
5. reporting views (Phase 3, later)

---

## APIs Changed
None implemented yet. Planned first API surfaces (Phase 1):
- Supabase feature api.js modules for: reports (create/list/get), likes (toggle), comments (create/list)
- Express endpoint: `POST /api/analyze-report` — accepts a photo (or storage reference), returns suggested title/description/category

---

## Components Added
None implemented yet. Planned first components (Phase 1):
- `ReportSubmissionFlow` (capture → geolocation → AI auto-fill review → submit)
- `FeedList` / `ReportCard`
- `ReportDetailView`
- `StatusChip`
- `PhotoCaptureField`

---

## Remaining TODOs (Priority Order)
1. Decide and document Express server hosting (Render/Railway/Fly.io/other).
2. Set up Supabase project, environment variables, and initial `users` table with role column.
3. Write and execute the Phase 1 migrations (issue_reports, report_likes, report_comments + triggers + RLS).
4. Scaffold the Express server with the single `/api/analyze-report` endpoint and choose the AI vision provider/model.
5. Build the citizen report submission flow end-to-end.
6. Build the public feed with like/comment.
7. Fill in `README.md` with real project description, setup, and run instructions.

---

## Known Risks
- The AI auto-fill provider/model has not been finalized — endpoint contract in ARCHITECTURE.md/DATABASE.md may need adjustment once chosen (e.g. response shape, latency, cost per call).
- Express hosting is undecided; until resolved, local development should treat the AI endpoint as mockable so frontend work isn't blocked.
- No RLS policies exist yet — do not treat any table as access-controlled until Phase 1 RLS work is complete.

---

## Exact Next Task for Following Agent
Begin Phase 1: set up the Supabase project and write the first migration for `users` and `issue_reports` (see DATABASE.md sections 4 and 16), then present the SQL migration to the user per the Database-First Rule in AGENTS.md before writing any API or UI code.
