import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { useProfileStore } from '../stores/profileStore.js';
import { AuroraOrb } from './AuroraOrb.jsx';

export function ProtectedRoute() {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();
  // 'loading' | 'pending' (onboarding not done) | 'done'
  const [onboardingStatus, setOnboardingStatus] = useState('loading');

  useEffect(() => {
    if (!session) return;
    useProfileStore
      .getState()
      .fetch()
      .then((res) => setOnboardingStatus(res?.profile?.onboarding_completed ? 'done' : 'pending'))
      // Fail open: a network hiccup here shouldn't trap the user in a
      // redirect loop — worst case they see Home once, not a blocked app.
      .catch(() => setOnboardingStatus('done'));
  }, [session]);

  if (isLoading || (session && onboardingStatus === 'loading')) {
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
  if (onboardingStatus === 'pending' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
