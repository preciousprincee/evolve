import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// This client uses the SERVICE ROLE key and therefore bypasses Row Level
// Security entirely. It must:
//   1. Never be imported outside the backend process.
//   2. Never have a user-supplied ID trusted for a WHERE clause without
//      that ID first coming from a verified JWT (see middleware/auth.js).
// Every query built with this client MUST explicitly scope by the
// authenticated user's id — RLS is not there as a safety net here.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
