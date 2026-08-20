import { create } from 'zustand';
import { supabase } from '../services/supabaseClient.js';
import { useProfileStore } from './profileStore.js';

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isGuest: false,
  initError: null,

  init: async () => {
    try {
      // A hung network call here (bad VITE_SUPABASE_URL, connectivity issue,
      // etc.) would otherwise leave isLoading true forever with zero
      // feedback — ProtectedRoute just shows a spinner indefinitely. This
      // race guarantees init() always resolves one way or the other.
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out reaching Supabase auth. Check VITE_SUPABASE_URL and your connection.')), 10000)
      );
      const { data } = await Promise.race([supabase.auth.getSession(), timeout]);

      set({
        session: data.session,
        user: data.session?.user ?? null,
        isGuest: data.session?.user?.is_anonymous === true,
        isLoading: false,
        initError: null,
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isGuest: session?.user?.is_anonymous === true,
        });
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Auth initialization failed:', err.message);
      set({ isLoading: false, initError: err.message });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false });
    useProfileStore.getState().clear();
  },
}));
