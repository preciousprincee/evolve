import { useEffect, useState } from 'react';
import { AuroraOrb } from './AuroraOrb.jsx';

/**
 * Shows the same "You're offline" message as public/offline.html, but
 * driven by the browser's actual connectivity state (navigator.onLine +
 * the online/offline window events) instead of Workbox's navigateFallback.
 * navigateFallback intercepts navigation requests unconditionally — it has
 * no idea whether the network is really up — so it isn't the right tool
 * for "tell the user they've lost their connection." This is.
 */
export function OfflineScreen({ children }) {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return children;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-[360px]">
        <div className="mx-auto mb-5">
          <AuroraOrb size={64} />
        </div>
        <h1 className="text-xl font-display mb-2">You're offline</h1>
        <p className="text-white/50 leading-relaxed">
          Evolve needs a connection to reach your companion. Your recent
          conversations and memories are still here — reconnect when
          you're ready.
        </p>
      </div>
    </div>
  );
}
