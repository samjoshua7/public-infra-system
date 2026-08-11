# Implementation Roadmap

This roadmap orders the work so the core reporting flow and status pipeline are reliable before analytics and broader enhancements are added.

## Phase 0 — Foundation

### Features
- repository documentation and architecture baseline
- environment variable contract (frontend + Express)
- local development and deployment conventions

### Database work
- define core tables and naming conventions
- document status pipeline and RLS principles

### Frontend work
- create the application shell and route structure
- implement authentication layout and protected routes

### Backend work
- configure Supabase project and environment variables
- scaffold the standalone Express server (AI auto-fill service only)
- define initial auth roles: CITIZEN, GOVERNMENT_OFFICIAL, ADMIN
- decide and document hosting for the Express server

### Acceptance criteria
- documentation is aligned with implementation intent
- the team can start building without conflicting architecture choices

### Definition of Done
- architecture, database, and rollout guidance are consistent
- the repository contains no contradictory stack or workflow guidance

### Testing checklist
- confirm the environment variable contract is documented for both frontend and Express
- confirm the role model is understood by the implementation team

### Recommended commit names
- docs: establish architecture baseline
- docs: codify database contract

### Milestones
- project constitution and implementation blueprint are approved

## Phase 1 — Core Reporting Flow

### Features
- authentication and roles
- citizen report submission: photo capture, browser geolocation, AI auto-fill (title/description/category), review-and-edit, submit
- public feed: view reports, like, comment
- basic report detail view

### Database work
- create issue_reports, report_likes, report_comments tables and constraints
- add triggers for like_count/comment_count caches
- implement RLS policies for CITIZEN insert/read and public feed visibility

### Frontend work
- implement login and protected navigation
- implement the report submission flow (capture -> geolocation -> AI auto-fill -> review -> submit)
- implement the public feed list and report detail view with like/comment
- add loading, error, and empty states, including a distinct AI-analyzing state

### Backend work
- implement the single Express AI auto-fill endpoint (photo in, suggested title/description/category out)
- ensure the AI provider key lives only in the Express environment

### Acceptance criteria
- a citizen can submit a report with photo, GPS coordinates, and AI-suggested (editable) fields
- any authenticated user can view the public feed and like/comment on a report
- geolocation permission denial blocks submission with a clear message
- AI auto-fill failure falls back to manual entry without blocking submission

### Definition of Done
- the core reporting workflow is implemented and protected by RLS
- the AI auto-fill call is isolated to the Express service with no key exposure in the browser

### Testing checklist
- verify permitted and prohibited role paths for report creation
- verify a report cannot be created without geolocation
- verify like/comment counts update correctly
- verify AI auto-fill failure degrades gracefully

### Recommended commit names
- feat: add auth and role guards
- feat: add report submission flow with geolocation
- feat: add AI auto-fill Express endpoint
- feat: add public feed with like/comment

### Milestones
- Phase 1 citizen reporting flow is usable end-to-end

## Phase 2 — Government Dashboard and Status Pipeline

### Features
- government official dashboard: detailed report view, status pipeline controls
- status transitions: posted → action_taken → fixed
- status history / audit trail visible on report detail
- admin: user and role management, content moderation

### Database work
- add report_status_history table and status-sync trigger
- extend RLS so only GOVERNMENT_OFFICIAL/ADMIN can write status changes
- add moderation flag/status for ADMIN-level content moderation

### Frontend work
- implement the official dashboard list/detail views with status controls
- implement the admin user/role management screens
- surface status history on the report detail view for all users

### Backend work
- ensure status transitions are validated server-side (RLS + function), not just in the UI

### Acceptance criteria
- an official can change a report's status and the change is reflected immediately in the feed and detail view
- a citizen cannot change report status through any client path
- an admin can change user roles and moderate reports
- status history is visible and accurate

### Definition of Done
- the status pipeline and admin workflows are implemented without bypassing database safety rules

### Testing checklist
- verify status can only move posted → action_taken → fixed (no arbitrary jumps unless explicitly allowed)
- verify only GOVERNMENT_OFFICIAL/ADMIN can write to report_status_history
- verify admin role changes take effect and are enforced by RLS immediately

### Recommended commit names
- feat: add government official dashboard
- feat: add status pipeline and history tracking
- feat: add admin user and role management

### Milestones
- government officials and admins can actively manage the reporting pipeline

## Phase 3 — Analytics and Insight

### Features
- dashboard metrics: reports by category, by status, by area
- average resolution time reporting
- map-based feed view
- notifications on status change (stretch)

### Database work
- add reporting views and summary functions
- keep the reporting layer read-only
- consider PostGIS if area/proximity queries become central

### Frontend work
- add analytics/dashboard screens for officials and admins
- add a map view of reports (clustering as volume grows)

### Backend work
- verify reporting queries perform well enough for the expected data volume

### Acceptance criteria
- analytics screens reflect the core transactional data accurately
- reporting does not introduce write-path complexity into the core model

### Definition of Done
- reporting/analytics is implemented on top of stable transactional data

### Testing checklist
- verify reports reflect the same data as the transactional tables
- verify access restrictions remain appropriate (public vs. official-only analytics, if any)

### Recommended commit names
- feat: add analytics dashboard
- feat: add map-based feed view

### Milestones
- officials and admins can review civic infrastructure trends from the system
