# UGC NET Paper 1 Portal

Exam-prep platform for UGC NET Paper 1 — full-length previous year question paper simulations and unit-wise targeted practice.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres) — reusing the shared **mrashutoshkumaredu** project (also used by [Polity Prep Hub](https://github.com/mrashutoshkumaredu))
- Vitest + React Testing Library for unit/component tests
- KaTeX for math rendering, `isomorphic-dompurify` for sanitizing question/table HTML before render

This is a rewrite of the original single-file `index.html` + `app.js` version (vanilla JS, Tailwind via CDN) into a proper Next.js app, matching the structure and conventions of the sibling Polity Prep Hub project.

## How tests work (October 2026)

- **The answer key never reaches the browser before submitting.** Browsers can't read `correct_option` or `ai_hint` from the database (column privileges, see `supabase/migrations/20261017_02_lock_answer_key.sql`). Tests run through database functions:
  - `get_catalog()`: paper and unit counts for the home page.
  - `start_test(mode, paper, unit, count)`: login required; creates a test session and returns its questions without answers. Unit practice is a fresh random set each time, keeping passage/table questions together.
  - `resume_test(session)`: reloads an unfinished test with its original start time.
  - `submit_test(session, answers)`: scores on the server (2 marks per correct answer, no negative marking, NTA-dropped questions count as correct), saves the attempt once, then returns the key and explanations.
- **Resume after refresh.** Answers are saved on the student's device (`lib/progress.ts`); the session id is in the URL and on the home page ("Resume test"). The timer counts down to a fixed end time, so it keeps running while the page is closed, like the real exam.
- **Admin page** (`/admin`): student reports with the full question, its paper and question number; edit the question and mark reports resolved. Admin emails live in the `app_admins` table.
- **Password reset** (`/reset-password`) and plain-English login errors (`lib/authErrors.ts`).
- **Tests**: Vitest covers scoring rules, normalisation, saved progress and the question palette. Run with `npm test`. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build.

Database changes are kept in `supabase/migrations/`. Step 1 only adds things; step 2 locks the answer key and must run after the new code is live.

## Setup

```bash
npm install
npm run dev
```

Create `.env.local` with the shared Supabase project's URL and anon key. `.env.local.example` shows the format without real values, for version control. These are anon/publishable keys (safe to expose to the browser — access is enforced by Postgres Row Level Security, not by keeping the key secret).

## Deployment

This repo is already linked to a Vercel project (`ugc-net-v4`) via GitHub, so pushes to `main` auto-deploy. **After merging this rewrite, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project's Environment Variables** (Project Settings → Environment Variables) — the previous static site didn't need them since the values were hardcoded directly in `app.js`.

If CI's build step ever fails for missing env vars, add the same two as repository secrets (Settings → Secrets and variables → Actions) — most pages are client components so this is unlikely to be needed, but the workflow is wired to pick them up if so.

## Known follow-ups

- Supabase Auth: turn on "leaked password protection" in the dashboard.
- Supabase Auth: add `https://ugc-net-v4.vercel.app/reset-password` to the allowed redirect URLs so password-reset emails work.
- Add the questions NTA dropped (marked `is_dropped`) so those papers have all 50 questions and number them.
