import React from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../stores/uiStore.js';
import { Button } from './Button.jsx';

export function InstallPrompt() {
  const { isInstallPromptVisible, deferredInstallPrompt, setInstallPrompt, dismissInstallPrompt } = useUiStore();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPrompt]);

  const handleInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    dismissInstallPrompt();
  };

  return (
    <AnimatePresence>
      {isInstallPromptVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-24 left-3 right-3 z-50 glass-panel-solid p-4 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-ink-muted">Install Evolve for the full companion experience.</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={dismissInstallPrompt}>
              Not now
            </Button>
            <Button className="!px-3 !py-2 text-xs" onClick={handleInstall}>
              Install
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
