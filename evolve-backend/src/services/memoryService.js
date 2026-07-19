import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const VALID_CATEGORIES = [
  'goal', 'dream', 'song', 'movie', 'book', 'birthday', 'friend', 'family',
  'achievement', 'fear', 'habit', 'career', 'study_progress',
  'health_preference', 'inside_joke', 'important_moment', 'other',
];

// --- User-initiated CRUD (RLS-scoped via req.userClient) ------------------

export async function listMemories(userClient, category) {
  let query = userClient.from('memories').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new AppError(500, 'Failed to load memories.', 'MEMORY_LOAD_FAILED');
  return data;
}

export async function createMemory(userClient, userId, { category, content }) {
  const { data, error } = await userClient
    .from('memories')
    .insert({ user_id: userId, category, content })
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to save memory.', 'MEMORY_CREATE_FAILED');
  return data;
}

export async function updateMemory(userClient, memoryId, updates) {
  const { data, error } = await userClient
    .from('memories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', memoryId)
    .select()
    .single();

  // RLS means this returns 0 rows (not an error) if the memory belongs to
  // someone else — surface that as a 404, not a 403, to avoid confirming
  // the record's existence to a user who doesn't own it.
  if (error || !data) throw new AppError(404, 'Memory not found.', 'MEMORY_NOT_FOUND');
  return data;
}

export async function deleteMemory(userClient, memoryId) {
  const { data, error } = await userClient.from('memories').delete().eq('id', memoryId).select().single();
  if (error || !data) throw new AppError(404, 'Memory not found.', 'MEMORY_NOT_FOUND');
  return { deleted: true };
}

// --- System-initiated extraction (admin client, backend-only) -------------

/**
 * Best-effort, non-blocking: called after a chat exchange to pull structured
 * memories out of the conversation via a small separate Groq call. Failures
 * here must never affect the user-facing chat response, so callers should
 * invoke this fire-and-forget with .catch(logger).
 */
export async function extractAndStoreMemories(groqClient, aiConfig, userId, userMessage, assistantReply) {
  const extractionPrompt = `Extract any durable personal facts worth remembering long-term from this exchange (goals, dreams, favorite songs/movies/books, birthdays, people mentioned, achievements, fears, habits, career/study details, health preferences, inside jokes, important moments). Respond ONLY with a JSON array of objects like {"category": "...", "content": "..."}, using only these categories: ${VALID_CATEGORIES.join(', ')}. If nothing durable is worth remembering, respond with [].

User: ${userMessage}
Companion: ${assistantReply}`;

  try {
    const completion = await groqClient.chat.completions.create({
      model: aiConfig.model,
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    const jsonText = raw.replace(/^```json\s*|```$/g, '').trim();
    const candidates = JSON.parse(jsonText);

    if (!Array.isArray(candidates) || candidates.length === 0) return;

    const rows = candidates
      .filter((c) => VALID_CATEGORIES.includes(c.category) && typeof c.content === 'string' && c.content.length <= 2000)
      .map((c) => ({ user_id: userId, category: c.category, content: c.content }));

    if (rows.length === 0) return;

    const { error } = await supabaseAdmin.from('memories').insert(rows);
    if (error) logger.error({ event: 'memory_extraction_insert_failed', userId }, error.message);
  } catch (err) {
    logger.warn({ event: 'memory_extraction_failed', userId, message: err.message }, 'Memory extraction skipped');
  }
}
