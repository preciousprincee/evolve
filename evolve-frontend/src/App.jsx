import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.js';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
import { AppShell } from './components/AppShell.jsx';
import { AuroraOrb } from './components/AuroraOrb.jsx';
import Login from './pages/Login.jsx';

// Code-split everything past the login screen — a fresh visitor only ever
// needs Login.jsx on first paint; Chat, Timeline, Profile, Onboarding, and
// especially AdminUsers (which almost nobody hits) were all being bundled
// and parsed upfront before this. Each becomes its own chunk, fetched only
// when its route is actually visited.
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Call = lazy(() => import('./pages/Call.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Timeline = lazy(() => import('./pages/Timeline.jsx'));
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuroraOrb size={80} />
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/call" element={<Call />} />

            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/profile" element={<Profile />} />

              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
