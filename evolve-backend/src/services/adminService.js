import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { AppError } from '../utils/AppError.js';

const MAX_PAGE_SIZE = 100;

/**
 * Paginated, searchable user list for the admin dashboard.
 *
 * profiles and relationship_progress both reference auth.users directly
 * (no FK between them), so Supabase's nested-select join syntax doesn't
 * apply here — we fetch the page of profiles first, then batch-fetch
 * relationship_progress for just those ids in a second query and merge
 * in memory. This keeps every query indexed and bounded regardless of
 * total user count.
 */
export async function listUsers({ page = 1, pageSize = 25, search = '' } = {}) {
  const size = Math.min(pageSize, MAX_PAGE_SIZE);
  const from = (page - 1) * size;
  const to = from + size - 1;

  let query = supabaseAdmin
    .from('profiles')
    .select('id, name, nickname, age, career, is_guest, romantic_mode_enabled, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search.trim()) {
    // Matches the gin index added in migration 003.
    query = query.or(`nickname.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data: profiles, error, count } = await query;

  if (error) {
    throw new AppError(500, 'Failed to load users.', 'ADMIN_LIST_FAILED');
  }

  const ids = profiles.map((p) => p.id);

  const [{ data: relationships }, { data: credits }] = await Promise.all([
    ids.length
      ? supabaseAdmin.from('relationship_progress').select('user_id, level, xp, days_together').in('user_id', ids)
      : { data: [] },
    ids.length ? supabaseAdmin.from('credits').select('user_id, balance').in('user_id', ids) : { data: [] },
  ]);

  const relByUser = new Map((relationships || []).map((r) => [r.user_id, r]));
  const creditsByUser = new Map((credits || []).map((c) => [c.user_id, c]));

  const users = profiles.map((p) => ({
    ...p,
    relationship: relByUser.get(p.id) || null,
    credits: creditsByUser.get(p.id) || null,
  }));

  return {
    users,
    page,
    pageSize: size,
    total: count ?? users.length,
    totalPages: Math.max(1, Math.ceil((count ?? users.length) / size)),
  };
}

/**
 * Full detail for one user — includes auth-layer data (email, last sign-in)
 * which lives in auth.users, not profiles, so it needs the admin auth API.
 */
export async function getUserDetail(userId) {
  const [{ data: profile, error: profileErr }, { data: relationship }, { data: credits }, { data: authUser }, { count: memoryCount }, { count: messageCount }] =
    await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('relationship_progress').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('credits').select('*').eq('user_id', userId).single(),
      supabaseAdmin.auth.admin.getUserById(userId).then((r) => r.data || {}),
      supabaseAdmin.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

  if (profileErr || !profile) {
    throw new AppError(404, 'User not found.', 'ADMIN_USER_NOT_FOUND');
  }

  return {
    profile,
    relationship: relationship || null,
    credits: credits || null,
    memoryCount: memoryCount ?? 0,
    messageCount: messageCount ?? 0,
    auth: authUser?.user
      ? {
          email: authUser.user.email,
          createdAt: authUser.user.created_at,
          lastSignInAt: authUser.user.last_sign_in_at,
        }
      : null,
  };
}
