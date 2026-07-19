import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const CREDIT_COSTS = {
  normal: 1,
  long: 2,
  voice: 5,
  image: 10, // reserved for future image generation feature
};

/**
 * Atomically checks and deducts credits via the deduct_credits() Postgres
 * function (row-locked, so concurrent requests can't double-spend). Must be
 * called with req.userClient (JWT-scoped) — NOT supabaseAdmin — because the
 * function relies on auth.uid() to identify whose balance to touch. This
 * makes it structurally impossible to deduct from anyone but the caller.
 *
 * Throws a 402 AppError with the exact user-facing message from the spec if
 * the user is out of credits, so callers can just await this and proceed.
 */
export async function chargeCredits(userClient, amount) {
  const { data, error } = await userClient.rpc('deduct_credits', { p_amount: amount });

  if (error) {
    logger.error({ event: 'credit_deduction_error', message: error.message }, 'deduct_credits RPC failed');
    throw new AppError(500, 'Unable to process request right now. Please try again.', 'CREDIT_CHECK_FAILED');
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.success) {
    throw new AppError(
      402,
      "You've used all of your AI credits this month. They'll reset automatically, or you can upgrade when subscriptions become available.",
      'OUT_OF_CREDITS'
    );
  }

  return result.remaining;
}
