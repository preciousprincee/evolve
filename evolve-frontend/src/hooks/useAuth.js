import { useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

export function useAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: authError } = await fn();
      if (authError) throw authError;
      return true;
    } catch (err) {
      // Supabase error messages are already safe/user-facing (they don't
      // leak internals), so it's fine to surface err.message directly here.
      setError(err.message || 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    signInWithPassword: (email, password) => run(() => supabase.auth.signInWithPassword({ email, password })),
    signUpWithPassword: (email, password) => run(() => supabase.auth.signUp({ email, password })),
    signInWithGoogle: () =>
      run(() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })),
    signInAsGuest: () => run(() => supabase.auth.signInAnonymously()),
    sendPasswordReset: (email) =>
      run(() => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })),
    updatePassword: (newPassword) => run(() => supabase.auth.updateUser({ password: newPassword })),
  };
}
