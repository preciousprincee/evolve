import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { logger } from '../utils/logger.js';

const PAGE_SIZE = 500;
const INACTIVITY_DAYS = 4;

const MESSAGES = {
  good_morning: [
    'Good morning! What\u2019s one thing you\u2019re looking forward to today?',
    'Morning! Hope you slept well \u2014 ready for today?',
  ],
  good_night: [
    'Winding down for the night? Rest well \u2014 I\u2019ll be here tomorrow.',
    'Good night! Proud of you for today.',
  ],
};

async function forEachUserPage(callback) {
  let from = 0;
  // Loop over auth users in pages so this scales to millions without
  // loading the whole table into memory at once.
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: Math.floor(from / PAGE_SIZE) + 1, perPage: PAGE_SIZE });
    if (error) {
      logger.error({ event: 'cron_list_users_failed' }, error.message);
      break;
    }
    if (!data.users.length) break;

    await callback(data.users.map((u) => u.id));

    if (data.users.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
}

function pickMessage(type) {
  const options = MESSAGES[type];
  return options[Math.floor(Math.random() * options.length)];
}

export async function generateGreetingNotifications(type) {
  let created = 0;
  await forEachUserPage(async (userIds) => {
    const rows = userIds.map((userId) => ({
      user_id: userId,
      type,
      payload: { message: pickMessage(type) },
    }));
    const { error } = await supabaseAdmin.from('notifications').insert(rows);
    if (error) logger.error({ event: 'cron_notification_insert_failed', type }, error.message);
    else created += rows.length;
  });
  return created;
}

export async function generateInactivityNotifications() {
  const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: inactiveUsers, error } = await supabaseAdmin
    .from('relationship_progress')
    .select('user_id, last_interaction_at')
    .lt('last_interaction_at', cutoff);

  if (error) {
    logger.error({ event: 'cron_inactivity_query_failed' }, error.message);
    return 0;
  }
  if (!inactiveUsers.length) return 0;

  const rows = inactiveUsers.map(({ user_id, last_interaction_at }) => {
    const days = Math.floor((Date.now() - new Date(last_interaction_at).getTime()) / (1000 * 60 * 60 * 24));
    return {
      user_id,
      type: 'inactivity',
      payload: { message: `It's been ${days} days since we last talked. I hope everything has been okay.` },
    };
  });

  const { error: insertErr } = await supabaseAdmin.from('notifications').insert(rows);
  if (insertErr) {
    logger.error({ event: 'cron_inactivity_insert_failed' }, insertErr.message);
    return 0;
  }
  return rows.length;
}

export async function generateBirthdayNotifications() {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  // Profiles table only stores age, not a birthdate — birthdays that users
  // mention are captured as `memories` with category='birthday' instead
  // (e.g. "Mom's birthday is March 3rd"). This scans those for today's date.
  const { data: birthdayMemories, error } = await supabaseAdmin
    .from('memories')
    .select('user_id, content')
    .eq('category', 'birthday');

  if (error) {
    logger.error({ event: 'cron_birthday_query_failed' }, error.message);
    return 0;
  }

  const matches = birthdayMemories.filter((m) => m.content.includes(`${mm}/${dd}`) || m.content.includes(`${mm}-${dd}`));
  if (!matches.length) return 0;

  const rows = matches.map((m) => ({
    user_id: m.user_id,
    type: 'birthday_reminder',
    payload: { message: `Don't forget: ${m.content}` },
  }));

  const { error: insertErr } = await supabaseAdmin.from('notifications').insert(rows);
  if (insertErr) {
    logger.error({ event: 'cron_birthday_insert_failed' }, insertErr.message);
    return 0;
  }
  return rows.length;
}
