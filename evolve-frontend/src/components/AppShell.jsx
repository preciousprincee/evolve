import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.jsx';
import { InstallPrompt } from './InstallPrompt.jsx';

export function AppShell() {
  return (
    <div className="min-h-screen">
      <Outlet />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
