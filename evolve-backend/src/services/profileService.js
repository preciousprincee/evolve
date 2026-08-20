import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { AppError } from '../utils/AppError.js';
import { getOrSet, invalidate } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

// IMPORTANT: supabaseAdmin uses the service-role key and bypasses RLS.
// Every query here MUST explicitly filter by the verified userId passed in
// — that userId must always originate from req.userId (set by requireAuth
// from a verified JWT), never from a request body or query param.

export const profileCacheKey = (userId) => `profile:${userId}`;

export async function getFullProfile(userId) {
  return getOrSet(profileCacheKey(userId), 30, async () => {
    const [{ data: profile, error: profileErr }, { data: relationship, error: relErr }, { data: credits, error: creditsErr }] =
      await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin.from('relationship_progress').select('*').eq('user_id', userId).single(),
        supabaseAdmin.from('credits').select('balance, cycle_reset_at').eq('user_id', userId).single(),
      ]);

    if (profileErr || relErr || creditsErr) {
      logger.error(
        {
          event: 'profile_fetch_failed',
          userId,
          profileError: profileErr ? { code: profileErr.code, message: profileErr.message } : null,
          relationshipError: relErr ? { code: relErr.code, message: relErr.message } : null,
          creditsError: creditsErr ? { code: creditsErr.code, message: creditsErr.message } : null,
        },
        'Supabase profile fetch failed'
      );
      throw new AppError(404, 'Profile not found.', 'PROFILE_NOT_FOUND');
    }

    return { profile, relationship, credits };
  });
}

async function getStoredAge(userId) {
  const { data } = await supabaseAdmin.from('profiles').select('age').eq('id', userId).single();
  return data?.age ?? null;
}

export async function updateProfile(userId, updates) {
  if (updates.romantic_mode_enabled === true) {
    // Age-gate: Romantic Mode is adults-only. Always check the age already
    // on file (or the one being set in this same request) — never trust a
    // client-asserted flag alone. The DB has a matching check constraint as
    // a second layer, but this is where we return a clean, explicit error.
    const effectiveAge = updates.age ?? (await getStoredAge(userId));
    if (!effectiveAge || effectiveAge < 18) {
      throw new AppError(403, 'Romantic Mode is only available to users 18 and older.', 'ROMANTIC_MODE_AGE_RESTRICTED');
    }
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    // The client only ever sees the generic AppError below — this is the
    // one place the real cause (missing column, check-constraint
    // violation, etc.) gets recorded, so it needs to actually happen.
    logger.error(
      {
        event: 'profile_update_failed',
        userId,
        supabaseCode: error.code,
        supabaseMessage: error.message,
        supabaseDetails: error.details,
        supabaseHint: error.hint,
        attemptedFields: Object.keys(updates),
      },
      'Supabase profile update failed'
    );
    throw new AppError(500, 'Failed to update profile.', 'PROFILE_UPDATE_FAILED');
  }

  await invalidate(profileCacheKey(userId));

  return data;
}
