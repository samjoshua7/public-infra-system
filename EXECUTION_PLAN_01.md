# EXECUTION_PLAN_01.md — Foundation + Phase 1 Build

This is a step-by-step build plan for a coding agent (Claude Code / Antigravity / etc.) to execute against this repository. Follow the steps **in order**. Do not skip the Database-First Rule from AGENTS.md — the SQL migration for this plan already exists at `supabase/migrations/001_init.sql` and must be run by the human in the Supabase SQL Editor before Step 5 (Supabase-dependent frontend work) is tested end-to-end.

Read `AGENTS.md`, `ARCHITECTURE.md`, and `DATABASE.md` before starting. This plan implements Phase 1 of `ROADMAP.md`.

---

## 0. Already Done (do not redo)

- ✅ `supabase/migrations/001_init.sql` — full schema, triggers, RLS, storage bucket. Ready to run as-is.
- ✅ `.env.example` (frontend) and `server/.env.example` (backend) — ready to copy and fill.
- ✅ AI provider decided: **Google Gemini API** (free, via Google AI Studio), model `gemini-2.5-flash-lite`.

## 1. Scope of This Plan

Build the full Phase 1 slice end-to-end:
- Project scaffolding (frontend + Express backend)
- Theming system with light/dark toggle, clean/minimal professional visual style
- Auth (Supabase) — login, signup, session, role resolution
- App shell (header, nav, theme toggle)
- Public feed (list reports, like, comment)
- Citizen report submission flow (photo capture → geolocation → AI auto-fill → review/edit → submit)
- Report detail view with status history display
- Express AI service (`/api/analyze-report` calling Gemini)

Out of scope for this plan (Phase 2, later): government official dashboard status controls, admin panel, analytics.

---

## 2. Repository Layout to Create

```text
public-infra-system/
  .env.example                 (exists)
  .env                         (git-ignored — human fills this in)
  index.html
  vite.config.js
  package.json                 (frontend)
  src/
    main.jsx
    app/
      App.jsx
      providers/
        AuthProvider.jsx
        ThemeModeProvider.jsx
      theme/
        theme.js               (light + dark MUI theme objects)
    lib/
      supabaseClient.js
      aiClient.js
    routes/
      index.jsx
      guards/
        ProtectedRoute.jsx
    features/
      auth/
        api.js
        LoginPage.jsx
        SignupPage.jsx
      feed/
        api.js
        FeedPage.jsx
        components/
          ReportCard.jsx
      reportSubmission/
        api.js
        ReportSubmissionPage.jsx
        components/
          PhotoCaptureStep.jsx
          AutoFillReviewStep.jsx
      reportDetail/
        api.js
        ReportDetailPage.jsx
    components/
      layout/
        AppShell.jsx
        AppHeader.jsx
        ThemeToggleButton.jsx
      cards/
      feedback/
        EmptyState.jsx
        ErrorAlert.jsx
        LoadingSkeleton.jsx
    hooks/
      useAuth.js
      usePermissions.js
      useGeolocation.js

  server/
    .env.example                (exists)
    .env                        (git-ignored — human fills this in)
    package.json
    index.js
    routes/
      analyzeReport.js
    lib/
      geminiClient.js

  supabase/
    migrations/
      001_init.sql               (exists)
```

---

## 3. Step-by-Step Execution

### Step 1 — Scaffold the frontend
1. `npm create vite@latest . -- --template react` at repo root (choose to keep existing files like README/AGENTS/etc.).
2. Install dependencies:
   ```
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   npm install react-router-dom
   npm install @supabase/supabase-js
   ```
3. Print these commands for the human — do not run long-lived dev servers yourself.

### Step 2 — Theme system (light/dark toggle, professional palette)
1. Create `src/app/theme/theme.js` exporting `getTheme(mode)` — a function returning an MUI theme for `'light'` or `'dark'`.
2. Palette direction (clean/minimal, government-trustworthy — confirmed with user):
   - Primary: deep civic blue (e.g. `#1E4D8C` light / lighter tint for dark mode)
   - Secondary/accent: muted teal or amber reserved **only** for status chips (posted = blue-gray, action_taken = amber, fixed = green)
   - Neutral grays for backgrounds and surfaces, generous whitespace, no gradients or decorative noise
   - Typography: system font stack or Inter, clear hierarchy, no more than 2 font weights per screen
3. Create `src/app/providers/ThemeModeProvider.jsx`:
   - Holds `mode` state (`'light' | 'dark'`), initialized from `localStorage.getItem('themeMode')`, falling back to the user's OS preference (`prefers-color-scheme`).
   - Persists changes to `localStorage`.
   - Wraps children in MUI `ThemeProvider` + `CssBaseline` using `getTheme(mode)`.
   - Exposes `mode` and `toggleMode()` via context.
4. Create `src/components/layout/ThemeToggleButton.jsx` — a small icon button (sun/moon) in the app header calling `toggleMode()`.

### Step 3 — Supabase client
1. Create `src/lib/supabaseClient.js`:
   ```js
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```
2. Never reference `VITE_SUPABASE_URL`/`ANON_KEY` anywhere else directly — always import this client.

### Step 4 — Auth
1. `src/features/auth/api.js`: `signUp`, `signIn`, `signOut`, `getSession` wrapping `supabase.auth.*`.
2. `src/app/providers/AuthProvider.jsx`: holds session + resolved role (query `public.users` by `id = session.user.id`), exposes via context. Subscribe to `supabase.auth.onAuthStateChange`.
3. `src/hooks/useAuth.js` and `src/hooks/usePermissions.js` (role checks: `isCitizen`, `isOfficial`, `isAdmin`).
4. `LoginPage.jsx` / `SignupPage.jsx` — simple MUI forms, no signup role picker (role always defaults to CITIZEN per DATABASE.md).
5. `src/routes/guards/ProtectedRoute.jsx` — redirects to `/login` if no session.

### Step 5 — App shell + routing
1. `src/routes/index.jsx` — routes: `/login`, `/signup`, `/feed` (default/home), `/report/new`, `/report/:id`. Wrap protected routes in `ProtectedRoute`.
2. `src/components/layout/AppShell.jsx` + `AppHeader.jsx` — app name, nav links (Feed, New Report), `ThemeToggleButton`, user menu (sign out).

### Step 6 — Feed feature
1. `src/features/feed/api.js`: `listReports({ page, category, status })` querying `issue_reports`, paginated (e.g. 20 per page), ordered by `created_at desc`.
2. `ReportCard.jsx`: photo thumbnail, title, category chip, status chip (color-coded per theme), like count + like button, comment count, relative timestamp.
3. `FeedPage.jsx`: paginated list, loading skeleton, empty state, error state.
4. Like toggle: insert/delete on `report_likes` where `user_id = auth.uid()` (RLS enforces ownership already — just call it).

### Step 7 — Report submission flow
1. `src/hooks/useGeolocation.js`: wraps `navigator.geolocation.getCurrentPosition`, returns `{ coords, error, status }`. If permission denied, surface a clear blocking error — do not allow submission without coordinates (per AGENTS.md).
2. `PhotoCaptureStep.jsx`: file/camera input, preview, "Analyze Photo" button.
3. On "Analyze Photo": upload photo to Supabase Storage bucket `report-photos` (path e.g. `reports/{uuid}.jpg`), then call `aiClient.analyzeReport(photoUrl)` (see Step 9) to get `{ title, description, category }`.
4. `AutoFillReviewStep.jsx`: editable Title/Description/Category fields pre-filled from the AI response — user must be able to edit before submitting. If the AI call fails, show these fields empty with a note, don't block the flow.
5. On submit: insert into `issue_reports` with `reporter_id = auth.uid()`, the uploaded `photo_url`, edited fields, and captured `latitude`/`longitude`. Redirect to `/report/:id` on success.

### Step 8 — Report detail
1. `src/features/reportDetail/api.js`: `getReport(id)`, `listComments(id)`, `listStatusHistory(id)`.
2. `ReportDetailPage.jsx`: full photo, title/description/category, status chip, status history timeline (read-only in this phase — official controls come in Phase 2), like button, comment list + add-comment form.

### Step 9 — Express AI service
1. `server/package.json`: `express`, `cors`, `dotenv`, `multer` (for photo upload if sending raw file) or accept a JSON body with the Supabase Storage public URL (simpler — prefer this since the photo is already uploaded to Storage by Step 7 before calling this endpoint).
2. `server/lib/geminiClient.js`: thin wrapper around the Gemini API using `GEMINI_API_KEY` and `GEMINI_MODEL` from env. Fetches the image from the given public Supabase Storage URL, sends it to Gemini with a prompt instructing it to return **strict JSON**: `{ "title": string, "description": string, "category": "pothole"|"streetlight"|"traffic_light"|"garbage"|"other" }`.
3. `server/routes/analyzeReport.js`: `POST /api/analyze-report` — body `{ photoUrl }`, returns the parsed `{ title, description, category }` JSON or a clear error. Validate/sanitize the model's output (correct category enum, reasonable string lengths) before returning.
4. `server/index.js`: Express app, CORS restricted to `FRONTEND_URL`, mounts the route, reads `PORT` from env.
5. `src/lib/aiClient.js` (frontend): `analyzeReport(photoUrl)` — `fetch(`${VITE_EXPRESS_API_URL}/api/analyze-report`, { method: 'POST', body: JSON.stringify({ photoUrl }) })`.

### Step 10 — Polish pass
1. Verify every list/detail view has loading, empty, and error states (per AGENTS.md section 19).
2. Verify keyboard accessibility on like/comment/theme-toggle controls.
3. Verify the theme toggle persists across reloads and looks correct in both modes on every screen built so far.
4. Run `npm run build` for the frontend — must succeed with no errors before considering this plan done.

---

## 4. Definition of Done for This Plan

- A citizen can sign up, log in, submit a report (photo + GPS + AI-assisted fields), see it in the feed, like/comment on any report, and view a report's detail page with status history.
- Light/dark theme toggle works everywhere and persists.
- No Supabase keys or the Gemini key appear anywhere in frontend code or bundle.
- `npm run build` (frontend) and `node server/index.js` (backend, manually started by the human) both run without errors.
- End this plan with a `HANDOVER.md` update per the Handover Rule in AGENTS.md.

---

## 5. What YOU (Joshua) Need to Do

Everything code-side is for the agent to build from this plan. Your part is just credentials and two manual actions:

1. **Run the SQL migration**
   - Open your Supabase project → SQL Editor → New query.
   - Paste the entire contents of `supabase/migrations/001_init.sql`.
   - Run it once. (It creates all tables, triggers, RLS policies, and the `report-photos` storage bucket.)

2. **Get a free Gemini API key**
   - Go to https://aistudio.google.com/apikey → "Create API key" (no credit card needed).

3. **Fill in the frontend env file**
   - Copy `.env.example` → `.env` in the repo root.
   - Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase Dashboard → Project Settings → API).
   - Leave `VITE_EXPRESS_API_URL` as-is for local dev.

4. **Fill in the backend env file**
   - Copy `server/.env.example` → `server/.env`.
   - Paste your Gemini key into `GEMINI_API_KEY`.
   - Leave the rest as-is for local dev.

5. **Run it locally** (once the agent has scaffolded the code)
   - Terminal 1: `npm install` then `npm run dev` (frontend, at repo root).
   - Terminal 2: `cd server && npm install && node index.js` (backend).

6. **Deploy later** (not needed for local dev/testing)
   - Frontend → Vercel (set the same `VITE_*` env vars in Vercel's project settings).
   - Backend → Render/Railway/Fly.io (set `GEMINI_API_KEY`, `GEMINI_MODEL`, `FRONTEND_URL` there; update `VITE_EXPRESS_API_URL` in Vercel to the deployed backend URL once you pick one).

That's it — no other manual SQL, no other manual config. Everything else in this plan is the coding agent's job.
