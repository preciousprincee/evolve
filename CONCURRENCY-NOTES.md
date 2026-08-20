# Concurrency code — quick reference

Five places in the codebase, in the order used in the summary.

---

### 1. Stateless backend (`middleware/auth.js`)
No session data in server memory — every request is verified independently via JWT.
```js
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError(401, 'Not authenticated.', 'UNAUTHENTICATED');
  }
  req.userId = data.user.id;
  next();
});
```

---

### 2. Distributed rate limiting (`middleware/rateLimiter.js`)
Shared Redis store instead of per-instance in-memory counters.
```js
const store = redisClient
  ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    })
  : undefined;
```

---

### 3. Redis caching (`utils/cache.js` + `services/profileService.js`)
```js
export async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = await redisClient.get(key);
  if (cached !== null) return JSON.parse(cached);
  const value = await fetchFn();
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  return value;
}
```
```js
export async function getFullProfile(userId) {
  return getOrSet(profileCacheKey(userId), 30, async () => { ... });
}
```

---

### 4. Non-blocking I/O (`services/profileService.js`)
Every DB/cache/AI call is async — nothing blocks Node's event loop.
```js
export async function getFullProfile(userId) {
  const [{ data: profile }, { data: relationship }, { data: credits }] =
    await Promise.all([ ... ]);
```

---

### 5. Pooled DB connections (`db/supabaseAdmin.js`)
`SUPABASE_URL` points at Supabase's pooled connection (PgBouncer, port 6543), letting many concurrent requests share a small set of real Postgres connections.
