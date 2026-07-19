import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isInstallPromptVisible: false,
  deferredInstallPrompt: null,

  setInstallPrompt: (event) => set({ deferredInstallPrompt: event, isInstallPromptVisible: true }),
  dismissInstallPrompt: () => set({ isInstallPromptVisible: false, deferredInstallPrompt: null }),
}));
