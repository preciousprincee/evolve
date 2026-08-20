import { create } from 'zustand';
import { profileApi } from '../api/profileApi.js';

/**
 * Every page that needed profile data (ProtectedRoute for the onboarding
 * gate, AdminRoute for role check, Home, Chat, Profile) was independently
 * calling GET /api/profile/me — up to 4-5 separate round trips stacking up
 * on a single navigation. This store fetches it once and shares it; call
 * `fetch()` for the cached value (fetches only if not already loaded) or
 * `refresh()` to force a re-fetch after a mutation (e.g. after saving
 * profile edits or toggling Romantic Mode).
 */
export const useProfileStore = create((set, get) => ({
  data: null, // { profile, relationship, credits }
  isLoading: false,
  hasFetched: false,
  error: null,

  fetch: async () => {
    const state = get();
    if (state.hasFetched && state.data) return state.data;
    if (state.isLoading) return state.data; // avoid duplicate in-flight requests
    set({ isLoading: true, error: null });
    try {
      const res = await profileApi.getMe();
      set({ data: res, isLoading: false, hasFetched: true });
      return res;
    } catch (err) {
      set({ isLoading: false, hasFetched: true, error: err.message });
      throw err;
    }
  },

  refresh: async () => {
    set({ hasFetched: false });
    return get().fetch();
  },

  clear: () => set({ data: null, isLoading: false, hasFetched: false, error: null }),
}));
