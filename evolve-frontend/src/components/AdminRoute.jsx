import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useProfileStore } from '../stores/profileStore.js';
import { AuroraOrb } from './AuroraOrb.jsx';

export function AdminRoute() {
  const [status, setStatus] = useState('loading'); // loading | allowed | denied

  useEffect(() => {
    // ProtectedRoute (the parent layout route) already fetched the profile
    // to check onboarding status — this reuses that cached result instead
    // of firing a second GET /api/profile/me.
    useProfileStore
      .getState()
      .fetch()
      .then((res) => setStatus(res?.profile?.role === 'admin' ? 'allowed' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AuroraOrb size={80} />
      </div>
    );
  }

  if (status === 'denied') return <Navigate to="/home" replace />;

  return <Outlet />;
}
