import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getOrSet } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

/**
 * Must run AFTER requireAuth. Loads the caller's role and rejects with 403
 * unless it's 'admin'. There is no client-writable path to `role` (see
 * migration 003) — it can only be granted via a direct DB update — so this
 * check is trustworthy as long as that invariant holds.
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  const role = await getOrSet(`role:${req.userId}`, 60, async () => {
    const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', req.userId).single();
    return data?.role || 'user';
  });

  if (role !== 'admin') {
    logger.warn({ event: 'admin_access_denied', userId: req.userId }, 'Non-admin attempted to access admin route');
    throw new AppError(403, 'You do not have access to this resource.', 'FORBIDDEN');
  }

  next();
});
