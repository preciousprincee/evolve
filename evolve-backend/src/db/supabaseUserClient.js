import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Creates a Supabase client authenticated as the CURRENT user (via their
 * verified JWT), using the public anon key. Unlike supabaseAdmin, queries
 * made with this client are subject to Row Level Security — auth.uid()
 * resolves correctly inside RLS policies and inside SECURITY DEFINER RPCs
 * like deduct_credits().
 *
 * Use this for:
 *   - calling deduct_credits() (relies on auth.uid())
 *   - direct user-initiated memory CRUD (defense-in-depth via RLS)
 *
 * Use supabaseAdmin instead for backend-only writes the client should never
 * be able to trigger directly (messages, XP, credit resets, notifications).
 */
export function createUserClient(accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
