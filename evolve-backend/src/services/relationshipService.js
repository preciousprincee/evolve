import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { logger } from '../utils/logger.js';

// XP required (cumulative) to REACH each level.
const LEVEL_THRESHOLDS = [
  { level: 'Stranger', xp: 0 },
  { level: 'Friend', xp: 100 },
  { level: 'Close Friend', xp: 400 },
  { level: 'Companion', xp: 1000 },
  { level: 'Best Friend', xp: 2500 },
  { level: 'Trusted Partner', xp: 6000 },
];

const XP_PER_MESSAGE = 5;
const XP_STREAK_BONUS = 10; // awarded once per calendar day, on the first message of that day

function levelForXp(xp) {
  let current = LEVEL_THRESHOLDS[0].level;
  for (const tier of LEVEL_THRESHOLDS) {
    if (xp >= tier.xp) current = tier.level;
  }
  return current;
}

/**
 * Called once per completed chat exchange. Backend-only (admin client) —
 * there is intentionally no client-writable path to this table.
 */
export async function recordInteraction(userId) {
  const { data: progress, error: fetchErr } = await supabaseAdmin
    .from('relationship_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchErr || !progress) {
    logger.error({ event: 'relationship_fetch_failed', userId }, 'Could not load relationship_progress');
    return;
  }

  const now = new Date();
  const last = progress.last_interaction_at ? new Date(progress.last_interaction_at) : null;
  const isNewCalendarDay = !last || last.toDateString() !== now.toDateString();

  // Streak: increments if the last interaction was "yesterday" (1 calendar
  // day ago), resets to 1 if there's a gap of 2+ days, stays the same if
  // it's a second message on the same day.
  let newStreak = progress.conversation_streak;
  if (isNewCalendarDay) {
    const daysSinceLast = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null;
    newStreak = daysSinceLast === 1 || daysSinceLast === 0 ? progress.conversation_streak + 1 : 1;
  }

  const xpGain = XP_PER_MESSAGE + (isNewCalendarDay ? XP_STREAK_BONUS : 0);
  const newXp = progress.xp + xpGain;
  const newLevel = levelForXp(newXp);

  const { error: updateErr } = await supabaseAdmin
    .from('relationship_progress')
    .update({
      xp: newXp,
      level: newLevel,
      conversation_streak: newStreak,
      days_together: isNewCalendarDay ? progress.days_together + 1 : progress.days_together,
      last_interaction_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (updateErr) {
    logger.error({ event: 'relationship_update_failed', userId }, 'Failed to update relationship_progress');
  }

  return { xp: newXp, level: newLevel, leveledUp: newLevel !== progress.level };
}
