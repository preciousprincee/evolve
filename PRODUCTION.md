# Production readiness — what changed and what you still need to do

## What's now in the code

**Caching**
- `evolve-backend/src/utils/cache.js` + `redisClient.js` — read-through cache for the profile/relationship/credits bundle (`GET /api/profile/me`), the hottest read in the app. 30s TTL, invalidated on every write (profile update, relationship XP change, credit charge).
- Degrades safely: if `REDIS_URL` isn't set, or Redis is down, the app falls back to hitting Supabase directly. No crashes, just slower.

**Rate limiting at scale**
- Previously in-memory — fine for one instance, silently *wrong* once you run more than one (each instance had its own separate counter, so N instances = N× the intended limit).
- Now uses a shared Redis store automatically when `REDIS_URL` is set. Required once you horizontally scale.

**Admin dashboard**
- New `role` column on `profiles` (`user` | `admin`), migration `003_admin_role.sql`.
- `GET /api/admin/users` (paginated, searchable by name/nickname) and `GET /api/admin/users/:userId` (full detail incl. email, XP, credits, memory/message counts) — both behind `requireAuth` + `requireAdmin`.
- Frontend: `/admin/users`, only reachable by users whose profile has `role = 'admin'`; a link appears on the Profile page for admins.
- **There is no API to grant yourself admin** — that's deliberate, it's not in the profile update schema. Grant it directly in Supabase:
  ```sql
  update public.profiles set role = 'admin' where id = '<your-user-uuid>';
  ```

## What you still need to provision (can't be done from this environment)

1. **Redis instance** — e.g. Upstash, Railway Redis, or AWS ElastiCache. Set `REDIS_URL` in your backend's env. Without it the app still works, just single-instance-only for rate limiting and uncached for reads.
2. **Run the new migration** — `003_admin_role.sql` (and `002_romantic_mode.sql` if not already applied) against Supabase.
3. **Multiple backend instances behind a load balancer** — the code is now stateless-safe to run N copies of (no in-memory state that matters once Redis is set), but actually running N copies is a platform-level decision (Railway/Render/Fly replicas, or a container orchestrator).
4. **Supabase connection limits at scale** — Supabase's pooled connection string (port 6543, PgBouncer) handles high concurrency well; the direct connection (5432) doesn't. Confirm `SUPABASE_URL` is the pooled one if you're not already using the JS client's default (it is, by default).
5. **CDN for the frontend static build** — Vite's build output is static; put it behind Cloudflare/Vercel/Netlify's CDN rather than serving it from the Node process.
6. **Observability** — logs are structured (pino) but not shipped anywhere. For thousands of concurrent users you'll want them going to something queryable (Datadog, Axiom, or even Supabase's own log drains) plus uptime alerting on `/health`.
