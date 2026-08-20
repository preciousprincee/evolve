# Troubleshooting log

Errors encountered while setting this project up, what caused them, and what fixed them.

---

### `Error: unable to determine transport target for "pino-pretty"`

```
C:\Users\DELL\Desktop\evolve-mvp\evolve-backend\node_modules\pino\lib\transport.js:160
      throw new Error(`unable to determine transport target for "${origin}"`)
```

**When:** Running `npm run dev` on the backend for the first time on Windows.

**Cause:** `src/utils/logger.js` configures a `pino-pretty` transport for colorized dev logs, but `pino-pretty` was never listed in `package.json` — so `npm install` never installed it, and pino couldn't resolve the transport module at runtime.

**Fix:** Added `pino-pretty` to `devDependencies` in `evolve-backend/package.json`. After pulling the update, run `npm install` again in `evolve-backend/` before starting the server.

---

### Chat input bar disappeared

**Cause:** The chat input's fixed footer and `BottomNav` were both pinned to `bottom-0`, occupying the same space — `BottomNav`'s `z-40` painted over the input.

**Fix:** Repositioned the input to sit just above the nav bar instead of overlapping it (`pages/Chat.jsx`).

---

### Romantic Mode toggle not animating correctly

**Cause:** The toggle knob only set `top-1`, with no `left` position — the browser had no fixed starting point to animate the slide transform from.

**Fix:** Added `left-1` as an explicit anchor and switched to `translate-x-0` / `translate-x-5` (`pages/Profile.jsx`).

---

### Romantic Mode toggle fails / does nothing

**Cause:** Migrations `002_romantic_mode.sql` and `003_admin_role.sql` hadn't been run in Supabase yet, so the `romantic_mode_enabled` and `role` columns didn't exist — every update request failed.

**Fix:** Run both migration files in the Supabase SQL Editor (in order, after `001`). Verify with:
```sql
select column_name from information_schema.columns 
where table_name = 'profiles' and column_name in ('romantic_mode_enabled', 'role');
```

---

### New in this update — things to do before testing

**Run migration `005_gender.sql`** in the Supabase SQL Editor (after 001–004) — onboarding now collects gender and the profile update endpoint will 400 with a Postgres check-constraint error until the column exists.

**Call Mode requires HTTPS (or localhost)** — `SpeechRecognition`/`getUserMedia` are blocked on plain HTTP in every browser that supports them. `localhost` during `npm run dev` is fine; a deployed preview needs to be served over HTTPS.

**Voice selection is best-effort** — the male/female voice picker (`useVoice.js`) matches against known voice names (Samantha, Zira, Daniel, David, etc.). If a browser/OS only ships one English voice, both genders will sound the same — there's no true gender metadata in the Web Speech API to fall back on.
