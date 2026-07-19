# Supabase Setup — Evolve

## 1. Create the project
1. Go to https://supabase.com/dashboard → New Project.
2. Choose a strong database password (this is NOT the same as any app secret — store it in a password manager, you likely won't need it directly).
3. Pick a region close to your primary user base (affects latency, not security).

## 2. Run the schema migration
1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`.
3. Run it. Confirm no errors.
4. Go to **Table Editor** → verify all 7 tables exist and each shows the RLS lock icon (enabled).

## 3. Enable Auth providers
Go to **Authentication → Providers**:

**Email**
- Enable "Email" provider.
- Enable "Confirm email" (recommended for production — prevents fake signups).
- Under **Authentication → Settings**, set a reasonable rate limit on signups (Supabase has defaults; leave unless you have reason to change).

**Google**
- Enable "Google" provider.
- You'll need a Google Cloud OAuth Client ID/Secret (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID → Web application).
- Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Paste Client ID + Secret into Supabase.

**Anonymous (Guest Mode)**
- Go to **Authentication → Settings → User Signups**.
- Enable "Allow anonymous sign-ins".
- This is what lets `supabase.auth.signInAnonymously()` work from the frontend. Anonymous users get a real `auth.users` row (so the `handle_new_user` trigger still fires and provisions profile/credits/relationship rows) but `is_anonymous = true`.
- Later, if you want guests to "upgrade" to a real account without losing data, use `supabase.auth.updateUser()` / `linkIdentity()` — I'll wire this into the frontend auth flow when we build it.

## 4. Get your keys
Go to **Project Settings → API**:

| Key | Where it's used | Never expose to |
|---|---|---|
| `Project URL` | Both frontend and backend | — (safe to expose) |
| `anon public` key | Frontend only | Never used server-side for privileged ops |
| `service_role` key | Backend only, server-side env var | **Never** ship to frontend, never commit to Git |

## 5. Password / JWT settings
- **Authentication → Settings → Password requirements**: set minimum length (recommend 8+) — Supabase defaults are reasonable.
- The JWT secret is managed by Supabase automatically; the backend verifies tokens using Supabase's public JWKS endpoint (no manual secret handling needed on your end — I'll implement this in the auth middleware in Step 3).

## 6. Environment variables you'll need going forward
Backend `.env` (never commit):
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GROQ_API_KEY=<groq-key>
```

Frontend `.env` (safe to expose, these are public by design):
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_BACKEND_URL=https://your-backend.up.railway.app
```

Once you've done steps 1–5, confirm and I'll move to Step 3: the Express backend foundation (security middleware, JWT verification, error handling).
