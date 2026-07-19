import React from 'react';
import { nextLevelInfo } from '../constants/relationship.js';

export function RelationshipBadge({ level, xp }) {
  const next = nextLevelInfo(xp);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-primary">{level}</span>
        {next && <span className="text-xs text-ink-faint">{next.xpNeeded} XP to {next.nextLevel}</span>}
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-aurora-gradient rounded-full transition-all duration-700"
          style={{ width: `${next ? next.progress * 100 : 100}%` }}
        />
      </div>
    </div>
  );
}
