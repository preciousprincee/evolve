import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev rather than silently making broken auth calls.
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file.');
}

// This is the ONLY Supabase client the frontend ever uses. It carries the
// public anon key (safe to expose) and handles session persistence/refresh
// automatically. It is never used to bypass RLS — that's the backend's job
// with the service-role key, which never reaches this codebase.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
