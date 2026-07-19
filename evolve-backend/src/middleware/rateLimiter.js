import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

// Shared handler so every limiter returns the same generic, safe response
// shape instead of the library's default body.
const limitHandler = (req, res, next) => {
  next(new AppError(429, 'Too many requests. Please slow down and try again shortly.', 'RATE_LIMITED'));
};

// Login/signup: keyed by IP since the user isn't authenticated yet.
// 5 attempts/minute/IP per spec.
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

// Chat: keyed by authenticated user id (set by requireAuth, which must run
// BEFORE this middleware in the route chain). 30 requests/minute/user.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});

// File uploads: 10/hour/user.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});

// General-purpose fallback for any other authenticated endpoint not covered
// above (profile edits, memory CRUD, etc) — generous but still bounded.
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  handler: limitHandler,
});
