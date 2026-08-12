# EXECUTION_PLAN_03.md — Rebrand, OpenRouter Switch, Opt-In AI Fill-Up

This plan covers three independent changes: rebranding the app, replacing Gemini with OpenRouter as the AI provider, and making the AI photo analysis opt-in via a checkbox instead of automatic. It assumes `EXECUTION_PLAN_01.md` and `EXECUTION_PLAN_02.md` are already built, and that migrations `001`, `002`, and `003` have all been run in Supabase.

## 0. Already Done (do not redo)

- ✅ `supabase/migrations/003_fix_role_recursion.sql` — fixed the `current_user_role()` infinite-recursion bug that was breaking official/admin login and the admin user list. Already executed by the user.
- ✅ `src/lib/imageCompression.js` — image compression, already wired in.
- Everything from `EXECUTION_PLAN_02.md` (owner edit/hide/delete, official dashboard, admin panel) should already exist — this plan builds on top of it, doesn't replace it.

## 1. Verify Migration 003 First

Before touching any code, confirm the recursion fix actually resolved the login issue:
1. Sign in as the government official account (`samc.ug.24.cs@francisxavier.ac.in`) and confirm `/dashboard` loads without a console error.
2. Sign in as the admin account (`samjoshua.paldwin@gmail.com`) and confirm `/admin` loads the user list without a console error (previously: `stack depth limit exceeded`, code `54001`).
3. If either still fails, stop and report the exact new error before proceeding with the rest of this plan — don't build on top of a broken auth/role layer.

## 2. Rebrand: CivicPulse → CivicSpeak

Find every occurrence of "CivicPulse" (case-sensitive and any obvious variants) and replace with "CivicSpeak". Known locations to check — there may be more, search the whole repo:

- `src/components/layout/AppHeader.jsx` — the `<Typography>` brand text next to the logo.
- `index.html` — `<title>` tag.
- `package.json` — `name` field (use a slug-safe form, e.g. `"civic-speak"` or `"civicspeak"` — don't put a space in the npm `name` field).
- `README.md` — any title/heading referencing the old name.
- Any other `.jsx`/`.md` file that mentions "CivicPulse" (grep the whole repo before finishing this step).

Do not change the repo folder name or git remote — just user-facing branding and metadata.

## 3. Switch AI Provider: Gemini → OpenRouter

### Why
The Gemini key has repeatedly failed and Google's billing prompt is an unnecessary hurdle for a student project. OpenRouter's free tier needs no credit card and exposes a real, currently-available free vision model.

### Model to use
`google/gemma-4-26b-a4b-it:free` — confirmed multimodal (text + image input), free, no card required, on OpenRouter as of this plan being written. Use this exact model string. If it ever gets deprecated, the fallback is `nvidia/nemotron-nano-12b-v2-vl:free` (also confirmed multimodal/free) — but try the Gemma one first.

### Step 1 — Env vars
1. In `server/.env.example` and `server/.env`, replace the Gemini variables with:
   ```
   OPENROUTER_API_KEY=
   OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
   ```
2. Tell the user to get a free key at https://openrouter.ai/keys (no card required) and paste it in.
3. Remove `GEMINI_API_KEY` / `GEMINI_MODEL` entirely from both files.

### Step 2 — Replace `server/lib/geminiClient.js` with `server/lib/openRouterClient.js`
1. Delete `server/lib/geminiClient.js`.
2. Create `server/lib/openRouterClient.js` exporting `analyzeReportImage(base64Image, mimeType)` with the same return shape as before (`{ title, description, category }`) so `server/routes/analyzeReport.js` barely needs to change.
3. Call `POST https://openrouter.ai/api/v1/chat/completions` with:
   - Header `Authorization: Bearer ${OPENROUTER_API_KEY}`
   - Header `Content-Type: application/json`
   - Headers `HTTP-Referer` and `X-Title` set to something reasonable (e.g. the app name) — OpenRouter recommends these for attribution, not strictly required but good practice.
   - Body:
     ```json
     {
       "model": "google/gemma-4-26b-a4b-it:free",
       "messages": [
         {
           "role": "user",
           "content": [
             { "type": "text", "text": "<the same civic-inspector JSON-only prompt used before>" },
             { "type": "image_url", "image_url": { "url": "data:<mimeType>;base64,<base64Image>" } }
           ]
         }
       ]
     }
     ```
   - Response text is at `data.choices[0].message.content` (OpenAI-compatible shape) instead of Gemini's `candidates[0].content.parts[0].text` — this is the main structural difference from the old code. Keep the same JSON-cleaning/parsing and category-validation logic that already exists.
4. Update `server/routes/analyzeReport.js`'s import from `geminiClient.js` to `openRouterClient.js` (function name can stay `analyzeReportImage` for a minimal diff).

### Step 3 — Update `server/lib/imageCompression.js` references
No change needed here — compression is unrelated to which AI provider is used.

## 4. Make AI Analysis Opt-In (checkbox, not automatic)

### Why
The user wants to control usage against the free daily limit — only call the AI when they actually want it, not on every photo capture.

### Step 1 — `PhotoCaptureStep.jsx`
1. Add a `Checkbox` labeled **"AI Fill-Up (auto-fill title, description & category)"**, unchecked by default, placed right below the photo preview.
2. Change the primary action button's behavior based on the checkbox:
   - If checked: label stays "Analyze Photo" (or similar), clicking it calls the existing `onAnalyze` flow (compress → call AI → move to step 2 with fields pre-filled).
   - If unchecked: relabel the button "Continue" (no AI call at all) — clicking it just compresses the photo (compression always happens regardless of the checkbox, since that's a storage-cost concern, not an AI-cost concern) and moves straight to step 2 with **empty** title/description/category fields for fully manual entry.
3. Pass the checkbox state up to `ReportSubmissionPage.jsx` (lift state, or pass a callback).

### Step 2 — `ReportSubmissionPage.jsx`
1. Add `const [aiFillUpEnabled, setAiFillUpEnabled] = useState(false);`
2. In `handleAnalyzePhoto` (or whatever it's renamed to), branch on `aiFillUpEnabled`:
   - `true` → existing behavior (call `analyzeReportPhoto`).
   - `false` → skip the AI call entirely, go straight to step 2 with blank fields. Don't show the "analyzing..." loading state at all in this path.
3. `aiSuccess` state should only be relevant when `aiFillUpEnabled` was true — when it's false, don't show any AI-related messaging on the review step (no "AI filled these in" banner, no "AI failed, fill manually" banner either — the user chose manual, so just show a plain form).

## 5. Step-by-Step Order

1. Verify migration 003 (Section 1) — stop and report back if broken.
2. Rebrand (Section 2) — quick, low-risk, do it first to get it out of the way.
3. OpenRouter switch (Section 3).
4. Opt-in checkbox (Section 4) — depends on Section 3 being done first since it changes when/whether the AI call happens.
5. Manually test: submit one report with the checkbox OFF (should never hit `/api/analyze-report` — check the Network tab) and one with it ON (should call OpenRouter and fill the fields).
6. `npm run build` — must succeed with no errors.

## 6. Definition of Done

- App is branded "CivicSpeak" everywhere a user can see it.
- Submitting a report with "AI Fill-Up" unchecked never calls the Express AI endpoint.
- Submitting a report with "AI Fill-Up" checked successfully calls OpenRouter and fills in title/description/category from a real photo (test with an actual pothole/streetlight photo).
- No `GEMINI_*` env vars or Gemini code remain anywhere in the repo.
- Official and admin dashboards both load without console errors.
- `npm run build` succeeds.
- End with a `HANDOVER.md` update per AGENTS.md.

## 7. What YOU (Joshua) Need to Do

1. Get a free OpenRouter API key: https://openrouter.ai/keys (no card needed) and put it in `server/.env` as `OPENROUTER_API_KEY`.
2. Delete the old `GEMINI_API_KEY` / `GEMINI_MODEL` lines from `server/.env` once the agent confirms the switch is done.
3. Restart the Express server after updating `.env` (env only loads on startup).
4. Test both paths (checkbox on/off) yourself once the agent finishes, with a real photo, before considering this plan done.
