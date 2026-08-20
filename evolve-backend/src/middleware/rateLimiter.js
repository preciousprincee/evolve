import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { AppError } from '../utils/AppError.js';
import { redisClient } from '../db/redisClient.js';

// Shared handler so every limiter returns the same generic, safe response
// shape instead of the library's default body.
const limitHandler = (req, res, next) => {
  next(new AppError(429, 'Too many requests. Please slow down and try again shortly.', 'RATE_LIMITED'));
};

// With multiple backend instances behind a load balancer, an in-memory
// store means each instance enforces its own separate limit (e.g. 5
// instances × 30/min = 150/min actually allowed) — a Redis-backed store
// makes the limit correct cluster-wide. Falls back to the default
// in-memory store automatically when REDIS_URL isn't set (dev/single
// instance), so this is safe in both environments.
const store = redisClient
  ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    })
  : undefined;

const withStore = (config) => rateLimit({ ...config, ...(store ? { store } : {}) });

// Login/signup: keyed by IP since the user isn't authenticated yet.
// 5 attempts/minute/IP per spec.
export const authLimiter = withStore({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

// Chat: keyed by authenticated user id (set by requireAuth, which must run
// BEFORE this middleware in the route chain). 30 requests/minute/user.
export const chatLimiter = withStore({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});

// File uploads: 10/hour/user.
export const uploadLimiter = withStore({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});

// General-purpose fallback for any other authenticated endpoint not covered
// above (profile edits, memory CRUD, etc) — generous but still bounded.
export const generalLimiter = withStore({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});

// Admin endpoints: tighter bound, keyed by user id. Admin traffic is
// low-volume by nature, so a stricter limit catches runaway scripts fast.
export const adminLimiter = withStore({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});
