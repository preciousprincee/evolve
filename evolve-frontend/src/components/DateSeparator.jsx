import React from 'react';
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 my-4" role="separator">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-ink-faint font-medium">{formatDateLabel(date)}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}
