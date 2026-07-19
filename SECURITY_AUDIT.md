# Security Audit — Evolve MVP

Reviewed against the security requirements given for this build. Status of each:

## Authentication
- ✅ Supabase Auth only — no custom auth implementation anywhere.
- ✅ Every protected backend route runs `requireAuth`, which verifies the JWT against Supabase (`auth.getUser`) rather than decoding it locally.
- ✅ No endpoint trusts a user id from a request body/param/query — `req.userId` (from the verified token) is the only identity source used in every service.

## Authorization / RLS
- ✅ RLS enabled on all 7 tables (`001_initial_schema.sql`).
- ✅ Every table's policies scope strictly to `auth.uid()`.
- ✅ Tables with no legitimate client-write path (`messages`, `relationship_progress`, `credits`, `daily_usage`) have **no client insert/update/delete policy at all** — those writes only happen server-side via the service-role key, which bypasses RLS by design but is scoped explicitly by `req.userId` in every query.
- ✅ `memories` has full client CRUD policies (select/insert/update/delete), all scoped to `auth.uid()`, since users are meant to edit their own memories directly.
- ⚠️ **Manual step required**: after running the migration, verify in Supabase's Table Editor that the RLS lock icon is shown as enabled on all 7 tables — this is called out explicitly in `SUPABASE_SETUP.md` step 2.

## Database security
- ✅ All queries use the Supabase client's parameterized query builder — no raw string-concatenated SQL anywhere in the codebase.
- ✅ Indexes added on the columns actually queried at scale (`messages(user_id, created_at)`, `memories(user_id, category)`, etc).
- ✅ No plaintext passwords stored — Supabase Auth handles password hashing entirely; this app never sees a raw password outside the Supabase SDK call itself.
- ✅ No API keys stored in any table.
- ✅ Service-role key lives only in backend environment variables, imported only by `src/db/supabaseAdmin.js`, never referenced by frontend code.

## API security
- ✅ Frontend never imports the Groq SDK or holds a Groq key — `evolve-frontend` has zero references to Groq. All AI calls go through `POST /api/chat/message`.
- ✅ Every chat request re-verifies the JWT before calling Groq.
- ✅ Rate limiting: 5/min/IP on... *(see note below — login itself happens via Supabase directly, not a backend route; the backend's own auth-adjacent route, `/api/auth/session`, uses `generalLimiter`; the 5/min/IP figure is enforced by Supabase Auth's own signup/login rate limits, configured in the Supabase dashboard per `SUPABASE_SETUP.md`)*. Chat: 30/min/user (`chatLimiter`). Uploads: 10/hr/user (`uploadLimiter`, ready for the future image-upload endpoint).
- ✅ Input validation via zod on every route that accepts a body/query/param — message length (≤4000 chars), profile field lengths, memory content (≤2000 chars), enum-constrained categories.
- ✅ Output validation: AI responses are rendered through `react-markdown`, which does not execute embedded HTML/scripts by default (no `rehype-raw` plugin included) — this is the primary XSS defense for AI-generated content.
- ✅ Error handling: centralized `errorHandler` returns generic messages for anything not explicitly thrown as an `AppError`; stack traces are logged server-side only, and only in non-production mode.
- ✅ Timeouts/retry: `streamCompletion` retries once on a transient failure and aborts cleanly if the client disconnects (`AbortController` wired to `req.on('close')`).

## AI credit protection
- ✅ Credits can only change via `deduct_credits()`, a `SECURITY DEFINER` Postgres function using `FOR UPDATE` row locking — no race condition between concurrent requests.
- ✅ The function reads `auth.uid()` internally; it is never passed a user id as a parameter, so it's structurally impossible to deduct from another user's balance.
- ✅ `credits` table has no client write policy of any kind — the only way to touch it is through the RPC.
- ✅ Credit check happens **before** the Groq call, so an out-of-credits user never triggers a billable upstream request.

## Environment variables & secrets
- ✅ `env.js` (backend) validates all required secrets at boot via zod and exits the process if anything is missing/malformed — fails loudly at deploy time, not silently at request time.
- ✅ `.env.example` provided for both repos; no real secret values committed anywhere; `.gitignore` excludes `.env` in both repos.
- ✅ Frontend env vars (`VITE_*`) are all public-by-design (Supabase URL + anon key + backend URL) — nothing sensitive is ever bundled into client JS.

## Input validation & file uploads
- ✅ All current text inputs are length- and type-bounded via zod schemas.
- ⚠️ **Not yet implemented**: the actual image upload endpoint (referenced by the `image` credit cost and `uploadLimiter`) — image support in chat is scaffolded (credit cost defined, rate limiter ready) but the endpoint itself is a next-iteration item, not part of this MVP slice. No file upload code exists yet, so there's nothing to audit here yet — flagging so it isn't mistaken for an oversight.

## XSS / CORS / Headers
- ✅ Helmet applied with a locked-down CSP appropriate for a JSON/SSE-only API (`script-src 'none'`, etc).
- ✅ CORS is an explicit allow-list (`ALLOWED_ORIGINS`), rejecting any unrecognized origin.
- ✅ AI-generated markdown is rendered without raw HTML execution (see API security above).

## Logging
- ✅ `logger.js` redacts tokens, keys, and `content` fields at the logger level — structurally prevents accidental logging of conversation content or secrets, not just a policy someone has to remember.
- ✅ Auth failures, rate-limit events, and unexpected errors are all logged with context (path, method, userId) but never with secrets or message bodies.

## Summary
No unresolved high-severity issues found against the stated requirements. The two items flagged with ⚠️ are explicitly out-of-scope-for-this-slice (image uploads) or a one-time manual verification step (confirming RLS is visibly enabled after running the migration) — neither represents a vulnerability in the shipped code, but both are worth closing out before public beta launch.
