import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Cron endpoints trigger backend-wide jobs (e.g. "send good morning
// notifications to all eligible users") and are called by an external
// scheduler (Railway Cron / GitHub Actions), not by a logged-in user — so
// they're authorized by a long shared secret instead of a JWT.
// Timing-safe comparison prevents a timing attack from guessing the secret.
export function requireCronSecret(req, res, next) {
  const provided = req.headers['x-cron-secret'] || '';
  const expected = env.CRON_SECRET;

  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));

  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    throw new AppError(401, 'Unauthorized.', 'UNAUTHENTICATED');
  }
  next();
}
