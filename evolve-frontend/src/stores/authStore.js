import { create } from 'zustand';
import { supabase } from '../services/supabaseClient.js';

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isGuest: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isGuest: data.session?.user?.is_anonymous === true,
      isLoading: false,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isGuest: session?.user?.is_anonymous === true,
      });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false });
  },
}));
