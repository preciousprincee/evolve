import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Redis is optional in dev (REDIS_URL unset → redisClient is null and the
// cache/rate-limit layers fall back to safe no-ops / in-memory behavior).
// In production it's required for two things that don't work correctly
// across multiple horizontally-scaled instances otherwise:
//   1. Shared response caching (src/utils/cache.js)
//   2. Shared rate-limit counters (src/middleware/rateLimiter.js)
export const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      // Keeps retrying in the background but never blocks the app boot —
      // a Redis outage should degrade performance, not take the API down.
      lazyConnect: false,
      enableOfflineQueue: true,
    })
  : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    logger.error({ event: 'redis_error', error: err.message }, 'Redis connection error');
  });
  redisClient.on('connect', () => {
    logger.info({ event: 'redis_connected' }, 'Redis connected');
  });
} else {
  logger.warn(
    { event: 'redis_disabled' },
    'REDIS_URL not set — caching and rate limiting are running in single-instance/no-op mode. Required for production at scale.'
  );
}
