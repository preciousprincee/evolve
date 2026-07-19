import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { createUserClient } from '../db/supabaseUserClient.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Verifies the Authorization: Bearer <jwt> header on every protected route.
 *
 * We call supabase.auth.getUser(token) rather than decoding the JWT
 * ourselves — this validates the token's signature and expiry against
 * Supabase Auth directly, so we never have to manage JWT secrets/JWKS
 * rotation ourselves and can't accidentally trust a forged or expired token.
 *
 * On success:
 *   - req.userId     — the ONLY source of truth for "who is making this
 *                       request" anywhere downstream. Never trust a body/param.
 *   - req.isGuest     — true for anonymous (guest) sessions.
 *   - req.token       — the raw verified JWT, for services that need it.
 *   - req.userClient  — a Supabase client scoped to this user's JWT, so any
 *                       query made with it is enforced by Row Level Security.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required.', 'UNAUTHENTICATED');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    logger.warn({ event: 'auth_failure', reason: error?.message }, 'JWT verification failed');
    throw new AppError(401, 'Invalid or expired session.', 'UNAUTHENTICATED');
  }

  req.userId = data.user.id;
  req.isGuest = data.user.is_anonymous === true;
  req.token = token;
  req.userClient = createUserClient(token);
  next();
});
