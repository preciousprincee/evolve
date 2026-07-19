# Evolve — The AI Companion That Grows With You

An AI companion PWA: React 19 + Vite frontend, Node/Express backend, Supabase (Auth + Postgres + RLS), Groq for streaming AI, installable on Android/desktop/iPhone.

## Repos in this archive

```
evolve-backend/    Express API — the only thing that ever talks to Groq or Postgres directly
evolve-frontend/   React 19 + Vite PWA
```

## Setup order

1. **Supabase** — follow `evolve-backend/SUPABASE_SETUP.md` (create project, run `supabase/migrations/001_initial_schema.sql`, enable Email/Google/Anonymous auth, grab your keys).
2. **Backend**
   ```bash
   cd evolve-backend
   cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, CRON_SECRET, ALLOWED_ORIGINS
   npm install
   npm run dev             # http://localhost:8080
   ```
3. **Frontend**
   ```bash
   cd evolve-frontend
   cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BACKEND_URL
   npm install
   npm run dev             # http://localhost:5173
   ```

## Deploy

- **Frontend → Vercel**: import `evolve-frontend`, set the three `VITE_*` env vars in Vercel's dashboard, build command `npm run build`, output `dist`.
- **Backend → Railway**: import `evolve-backend`, set all vars from `.env.example` in Railway's dashboard, start command `npm start`. Update `ALLOWED_ORIGINS` to your real Vercel URL once you have it (and update Vercel's `VITE_BACKEND_URL` to your real Railway URL).
- **Cron (daily moments)**: Railway's Cron Jobs (or GitHub Actions on a schedule) hitting `POST /api/cron/{good-morning,good-night,inactivity-check,birthday-check}` with header `X-Cron-Secret: <CRON_SECRET>`. Example schedules are documented at the top of `evolve-backend/src/routes/cron.routes.js`.

## Architecture at a glance

```
User → evolve-frontend (Vercel, PWA) → evolve-backend (Railway) → Groq
                                              ↓
                                      Supabase Postgres (RLS)
```

- The frontend **never** holds the Groq key or the Supabase service-role key — only the public anon key.
- Every backend route is JWT-verified (`requireAuth`) against Supabase before touching any data.
- AI credits are deducted **atomically** via a `SECURITY DEFINER` Postgres function (`deduct_credits`), row-locked to prevent race conditions — the client cannot add, reset, or bypass credits.
- Full data model, RLS policy rationale, and request flow are in the architecture blueprint covered during the build; see inline comments throughout `evolve-backend/src` and `supabase/migrations/001_initial_schema.sql` for the specifics.

## What's implemented

- Auth: email/password, Google OAuth, guest (anonymous), forgot password — all via Supabase Auth directly from the frontend.
- Profile, Relationship (XP/levels/streak), Memories (CRUD + auto-extraction from conversation), Credits (500/mo, atomic deduction), Messages (continuous per-user stream), Notifications (daily moments: good morning/night, inactivity check-ins, birthday reminders).
- Chat: streaming SSE responses, markdown rendering, typing cursor, auto-scroll, date separators.
- Home: relationship level + progress, mood, streak, days together, a recent memory, a suggested conversation starter.
- Memory Timeline: the signature feature — a filterable, chronological visual history of everything Evolve remembers.
- PWA: installable manifest, offline fallback page, app-shell caching, install prompt.

## Known simplifications for this MVP (documented, not hidden)

- Voice and image generation are priced in the credit system (`CREDIT_COSTS.voice`, `CREDIT_COSTS.image`) but not yet wired to real endpoints — the architecture (credit costs, prompts folder) is ready for them.
- Notification delivery is in-app only (no push notifications yet) — the `notifications` table and daily-moments cron are the foundation for adding Web Push later.
- Daily-moment cron runs for all users at fixed UTC times rather than per-user local time — fine for beta scale; timezone-aware scheduling is a natural next iteration.
