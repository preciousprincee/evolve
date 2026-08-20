import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { useProfileStore } from '../stores/profileStore.js';
import { AuroraOrb } from './AuroraOrb.jsx';

export function ProtectedRoute() {
  const { session, isLoading, initError } = useAuthStore();
  const location = useLocation();

  // Subscribed reactively (not copied into local state) so that ANY
  // refresh() elsewhere in the app — Onboarding finishing, Profile saving,
  // the Romantic Mode toggle — is picked up here automatically. The
  // earlier version copied the fetched status into its own useState once
  // per session and never re-checked, which caused onboarding to loop
  // forever even after it succeeded, since nothing told this component to
  // look again.
  const profileData = useProfileStore((s) => s.data);
  const hasFetchedProfile = useProfileStore((s) => s.hasFetched);

  useEffect(() => {
    if (!session) return;
    useProfileStore.getState().fetch().catch(() => {});
  }, [session]);

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-muted">Couldn't connect. {initError}</p>
        <button onClick={() => window.location.reload()} className="btn-ghost px-4 py-2 text-sm">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || (session && !hasFetchedProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AuroraOrb size={80} />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Applies no matter how the session was established — password sign-in,
  // Google OAuth, or an email-confirmation link redirect — not just the
  // signup/guest flows that explicitly navigate to /onboarding themselves.
  // Fail open on a fetch error (profileData null but hasFetched true):
  // don't trap the user in a redirect loop over a network hiccup.
  const onboardingPending = profileData && profileData.profile?.onboarding_completed === false;
  if (onboardingPending && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
