# HANDOVER.md — EXECUTION_PLAN_03.md: Rebrand, OpenRouter AI, Opt-In Checkbox

## Objective
Rebrand application from **CivicPulse** to **CivicSpeak**, replace Gemini with **OpenRouter** (`google/gemma-4-26b-a4b-it:free`) as the AI photo analysis provider, and make AI photo analysis **opt-in** via a checkbox (unchecked by default).

---

## Decisions Made & Implementation Details

1. **Rebranding**:
   - Rebranded app title and metadata to **CivicSpeak** across [AppHeader.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppHeader.jsx), [index.html](file:///d:/Git/public-infra-system/index.html), and [package.json](file:///d:/Git/public-infra-system/package.json).

2. **OpenRouter AI Integration**:
   - Built [server/lib/openRouterClient.js](file:///d:/Git/public-infra-system/server/lib/openRouterClient.js) using OpenRouter's OpenAI-compatible Chat Completions API (`POST https://openrouter.ai/api/v1/chat/completions`).
   - Configured model default to `google/gemma-4-26b-a4b-it:free` (multimodal vision + text, no credit card required).
   - Updated `server/.env` and `server/.env.example` to use `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
   - Updated [server/routes/analyzeReport.js](file:///d:/Git/public-infra-system/server/routes/analyzeReport.js) to call OpenRouter.
   - Deprecated `geminiClient.js` and removed all `GEMINI_*` env variables.

3. **Opt-In AI Analysis Flow**:
   - Added a `Checkbox` labeled **"AI Fill-Up (auto-fill title, description & category)"**, unchecked by default, in [PhotoCaptureStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/PhotoCaptureStep.jsx).
   - **Checkbox Unchecked (Default)**: Primary button reads "Continue". Clicking it compresses the photo and moves directly to Step 2 with empty fields for manual entry — no HTTP request is made to the Express AI endpoint.
   - **Checkbox Checked**: Primary button reads "Analyze Photo with AI". Clicking it calls OpenRouter and populates title, description, and category.
   - Updated [AutoFillReviewStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/AutoFillReviewStep.jsx) and [ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) to support the optional AI flow seamlessly.

---

## Files Modified & Created

### New Files Created
- [server/lib/openRouterClient.js](file:///d:/Git/public-infra-system/server/lib/openRouterClient.js) — OpenRouter API integration.

### Files Modified
- [src/components/layout/AppHeader.jsx](file:///d:/Git/public-infra-system/src/components/layout/AppHeader.jsx) — Rebranded to CivicSpeak.
- [index.html](file:///d:/Git/public-infra-system/index.html) — Updated page title to CivicSpeak.
- [package.json](file:///d:/Git/public-infra-system/package.json) — Updated package name to civicspeak.
- [server/.env](file:///d:/Git/public-infra-system/server/.env) & [server/.env.example](file:///d:/Git/public-infra-system/server/.env.example) — Configured OpenRouter environment variables.
- [server/routes/analyzeReport.js](file:///d:/Git/public-infra-system/server/routes/analyzeReport.js) — Routed AI requests to OpenRouter.
- [server/lib/geminiClient.js](file:///d:/Git/public-infra-system/server/lib/geminiClient.js) — Deprecated.
- [src/features/reportSubmission/components/PhotoCaptureStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/PhotoCaptureStep.jsx) — Added opt-in AI checkbox and dynamic button text.
- [src/features/reportSubmission/components/AutoFillReviewStep.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/components/AutoFillReviewStep.jsx) — Added support for optional AI fill-up messaging.
- [src/features/reportSubmission/ReportSubmissionPage.jsx](file:///d:/Git/public-infra-system/src/features/reportSubmission/ReportSubmissionPage.jsx) — Integrated opt-in AI state handling.

---

## Database Changes & SQL Migrations
- Migration `003_fix_role_recursion.sql` (`current_user_role` SECURITY DEFINER fix) was previously executed by the user in Supabase. No new SQL migrations required for this plan.

---

## What YOU (User) Need to Do

1. **Set OpenRouter API Key**:
   - Get a free key at [https://openrouter.ai/keys](https://openrouter.ai/keys) (no credit card required).
   - Add `OPENROUTER_API_KEY=your_key_here` into `server/.env`.
2. **Restart Express Server**:
   - In terminal `server/`, restart `npm start` so `.env` reloads.
3. **Run Build Verification**:
   - Execute `npm run build` in root to confirm clean compilation.
4. **Test Submissions**:
   - Test submitting a report with **AI Fill-Up OFF** (should skip AI API call entirely).
   - Test submitting a report with **AI Fill-Up ON** (should call OpenRouter and populate details).
