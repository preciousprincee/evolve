import React from 'react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/home', label: 'Home', icon: HomeIcon },
  { to: '/chat', label: 'Chat', icon: ChatIcon },
  { to: '/timeline', label: 'Timeline', icon: TimelineIcon },
  { to: '/profile', label: 'Companion', icon: ProfileIcon },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="glass-panel-solid mx-3 mb-3 rounded-2xl flex justify-around py-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-ink-primary' : 'text-ink-faint hover:text-ink-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'url(#g1)' : 'currentColor'} strokeWidth="1.8">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C6CF6" />
          <stop offset="100%" stopColor="#4FD1C5" />
        </linearGradient>
      </defs>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'url(#g2)' : 'currentColor'} strokeWidth="1.8">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C6CF6" />
          <stop offset="100%" stopColor="#4FD1C5" />
        </linearGradient>
      </defs>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.5-.75L4 21l1.75-4.9A8.5 8.5 0 1 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TimelineIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'url(#g3)' : 'currentColor'} strokeWidth="1.8">
      <defs>
        <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C6CF6" />
          <stop offset="100%" stopColor="#4FD1C5" />
        </linearGradient>
      </defs>
      <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
      <circle cx="20" cy="6" r="1.5" fill="currentColor" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'url(#g4)' : 'currentColor'} strokeWidth="1.8">
      <defs>
        <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C6CF6" />
          <stop offset="100%" stopColor="#4FD1C5" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  );
}
