// Mirrors backend/src/services/relationshipService.js thresholds — display
// only. The backend is the sole source of truth for actual XP/level values;
// this is used for things like "XP to next level" progress bars.
export const LEVEL_THRESHOLDS = [
  { level: 'Stranger', xp: 0 },
  { level: 'Friend', xp: 100 },
  { level: 'Close Friend', xp: 400 },
  { level: 'Companion', xp: 1000 },
  { level: 'Best Friend', xp: 2500 },
  { level: 'Trusted Partner', xp: 6000 },
];

export function nextLevelInfo(currentXp) {
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.xp > currentXp);
  if (idx === -1) return null; // max level reached
  const prev = LEVEL_THRESHOLDS[idx - 1] ?? { xp: 0 };
  const next = LEVEL_THRESHOLDS[idx];
  const progress = (currentXp - prev.xp) / (next.xp - prev.xp);
  return { nextLevel: next.level, xpNeeded: next.xp - currentXp, progress: Math.min(1, Math.max(0, progress)) };
}

export const COMPANION_STYLES = [
  { value: 'supportive', label: 'Supportive' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'playful', label: 'Playful' },
  { value: 'calm', label: 'Calm' },
  { value: 'direct', label: 'Direct' },
];

export const LOVE_LANGUAGES = [
  { value: 'words_of_affirmation', label: 'Words of Affirmation' },
  { value: 'acts_of_service', label: 'Acts of Service' },
  { value: 'receiving_gifts', label: 'Receiving Gifts' },
  { value: 'quality_time', label: 'Quality Time' },
  { value: 'physical_touch', label: 'Physical Touch' },
];

export const MEMORY_CATEGORIES = [
  'goal', 'dream', 'song', 'movie', 'book', 'birthday', 'friend', 'family',
  'achievement', 'fear', 'habit', 'career', 'study_progress',
  'health_preference', 'inside_joke', 'important_moment', 'other',
];
