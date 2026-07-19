import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { AppError } from '../utils/AppError.js';

// IMPORTANT: supabaseAdmin uses the service-role key and bypasses RLS.
// Every query here MUST explicitly filter by the verified userId passed in
// — that userId must always originate from req.userId (set by requireAuth
// from a verified JWT), never from a request body or query param.

export async function getFullProfile(userId) {
  const [{ data: profile, error: profileErr }, { data: relationship, error: relErr }, { data: credits, error: creditsErr }] =
    await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('relationship_progress').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('credits').select('balance, cycle_reset_at').eq('user_id', userId).single(),
    ]);

  if (profileErr || relErr || creditsErr) {
    throw new AppError(404, 'Profile not found.', 'PROFILE_NOT_FOUND');
  }

  return { profile, relationship, credits };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError(500, 'Failed to update profile.', 'PROFILE_UPDATE_FAILED');
  }

  return data;
}
