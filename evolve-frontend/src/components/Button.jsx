import React from 'react';
export function Button({ variant = 'primary', className = '', children, ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
