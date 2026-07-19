import React from 'react';
export function GlassCard({ children, className = '', solid = false, ...props }) {
  return (
    <div className={`${solid ? 'glass-panel-solid' : 'glass-panel'} p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
