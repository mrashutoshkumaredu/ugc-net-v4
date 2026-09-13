# UGC NET Paper 1 Portal

Exam-prep platform for UGC NET Paper 1 — full-length previous year question paper simulations and unit-wise targeted practice.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres) — reusing the shared **mrashutoshkumaredu** project (also used by [Polity Prep Hub](https://github.com/mrashutoshkumaredu))
- Vitest + React Testing Library for unit/component tests
- KaTeX for math rendering, `isomorphic-dompurify` for sanitizing question/table HTML before render

This is a rewrite of the original single-file `index.html` + `app.js` version (vanilla JS, Tailwind via CDN) into a proper Next.js app, matching the structure and conventions of the sibling Polity Prep Hub project.

## What changed from the old version

- **Answer key no longer reaches the browser before submission.** The old app fetched every question (including `correct_option` and `ai_hint`) client-side on page load — anyone could read the answer key from the network tab. Questions are now served through [`app/api/questions/route.ts`](app/api/questions/route.ts), which strips the answer key; scoring happens server-side in [`app/api/submit/route.ts`](app/api/submit/route.ts), which re-fetches the real rows, computes the score, saves the attempt, and only then returns the answer key for the results/review screen.
- **"Report Issue" actually saves now.** It used to just `console.log` and show an alert. It now inserts into a new `report_issues` table (RLS: users can insert/read their own reports).
- **Raw HTML question/table content is sanitized** with DOMPurify before rendering (`components/quiz/MathText.tsx`), instead of being trusted blindly via `innerHTML`.
- **Componentized** into `components/`, `hooks/`, and `lib/` instead of one 770-line `app.js`, with TypeScript types for the data model (`lib/types.ts`).
- **Tests**: `lib/scoring.ts` (pure scoring/formatting logic) and `components/quiz/PaletteDrawer.tsx` have Vitest coverage. Run with `npm test`.
- **CI**: `.github/workflows/ci.yml` runs lint, typecheck, tests, and a production build on every push/PR to `main`.

## Setup

```bash
npm install
npm run dev
```

`.env.local` is already filled in with the shared Supabase project's URL and anon key. `.env.local.example` shows the format without real values, for version control. These are anon/publishable keys (safe to expose to the browser — access is enforced by Postgres Row Level Security, not by keeping the key secret).

## Deployment

This repo is already linked to a Vercel project (`ugc-net-v4`) via GitHub, so pushes to `main` auto-deploy. **After merging this rewrite, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project's Environment Variables** (Project Settings → Environment Variables) — the previous static site didn't need them since the values were hardcoded directly in `app.js`.

If CI's build step ever fails for missing env vars, add the same two as repository secrets (Settings → Secrets and variables → Actions) — most pages are client components so this is unlikely to be needed, but the workflow is wired to pick them up if so.

## Known follow-ups (flagged, not fixed here)

- `public.questions_backup_linebreaks` in the shared Supabase project has Row Level Security disabled (200 rows exposed) and isn't referenced by this app. Decide whether to drop it or enable RLS with a policy matching `questions`.
- Supabase Auth's "leaked password protection" (checks against HaveIBeenPwned) is currently off — a one-click toggle in the Supabase Auth settings dashboard, unrelated to this codebase.
- No end-to-end (Playwright) tests yet — Vitest covers the pure logic and a couple of components; full user-flow coverage would be a reasonable next addition.
