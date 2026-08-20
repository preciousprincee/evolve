import { redisClient } from '../db/redisClient.js';
import { logger } from './logger.js';

/**
 * Read-through cache: returns the cached value if present, otherwise calls
 * `fetchFn`, caches the result, and returns it. Falls back to calling
 * fetchFn directly (no caching) if Redis is unavailable or errors — a cache
 * outage should never turn into a user-facing failure.
 */
export async function getOrSet(key, ttlSeconds, fetchFn) {
  if (!redisClient) return fetchFn();

  try {
    const cached = await redisClient.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ event: 'cache_read_failed', key, error: err.message }, 'Cache read failed, falling through');
  }

  const value = await fetchFn();

  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ event: 'cache_write_failed', key, error: err.message }, 'Cache write failed');
  }

  return value;
}

/** Deletes one or more exact cache keys. Safe no-op without Redis. */
export async function invalidate(...keys) {
  if (!redisClient || keys.length === 0) return;
  try {
    await redisClient.del(...keys);
  } catch (err) {
    logger.warn({ event: 'cache_invalidate_failed', keys, error: err.message }, 'Cache invalidation failed');
  }
}
