import { supabaseAdmin } from '../db/supabaseAdmin.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { chargeCredits, CREDIT_COSTS } from '../services/creditService.js';
import { streamCompletion } from '../services/aiService.js';
import { recordInteraction } from '../services/relationshipService.js';
import { extractAndStoreMemories, listMemories } from '../services/memoryService.js';
import { groqClient } from '../services/aiService.js';
import { aiConfig } from '../config/ai.js';
import { buildSystemPrompt } from '../prompts/companionPrompt.js';
import { invalidate } from '../utils/cache.js';
import { profileCacheKey } from '../services/profileService.js';

const HISTORY_LIMIT = 20;
const HISTORY_PAGE_MAX = 100;

export const getHistory = asyncHandler(async (req, res) => {
  const { userId, userClient } = req;
  const limit = Math.min(Number(req.query.limit) || 50, HISTORY_PAGE_MAX);
  const before = req.query.before; // ISO timestamp cursor for "load older"

  let query = userClient
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, 'Failed to load chat history.', 'CHAT_HISTORY_FAILED');
  }

  res.json({ messages: (data || []).reverse(), hasMore: (data || []).length === limit });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { userId, userClient } = req;

  // 1. Atomic credit check BEFORE calling Groq at all — never spend an
  //    upstream API call we can't charge for. Base cost is "normal"; we
  //    upgrade to "long" cost after seeing the actual response size below.
  await chargeCredits(userClient, CREDIT_COSTS.normal);
  invalidate(profileCacheKey(userId)).catch(() => {});

  // 2. Gather context — reads go through userClient (RLS-scoped) since
  //    select policies exist for all of these tables.
  const [{ data: profile }, { data: relationship }, recentMessages, memories] = await Promise.all([
    userClient.from('profiles').select('*').eq('id', userId).single(),
    userClient.from('relationship_progress').select('*').eq('user_id', userId).single(),
    userClient
      .from('messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)
      .then(({ data }) => (data || []).reverse()),
    listMemories(userClient),
  ]);

  const systemPrompt = buildSystemPrompt({ profile, relationship, memories });

  // 3. Persist the user's message (backend-only write — no client insert
  //    policy exists on `messages`, so this table can't be forged).
  //    Fired off, not awaited: nothing about starting the AI stream
  //    depends on this row existing yet, so blocking on it here was just
  //    adding a full DB round-trip to time-to-first-token on every message.
  //    Still awaited below, after the stream ends, so a failure is caught
  //    before the request completes.
  const userMessageInsert = supabaseAdmin
    .from('messages')
    .insert({ user_id: userId, role: 'user', content: message, credits_cost: CREDIT_COSTS.normal });

  // 4. Stream the response as Server-Sent Events.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  let fullReply = '';

  try {
    fullReply = await streamCompletion({
      model: aiConfig.model,
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...recentMessages, { role: 'user', content: message }],
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      signal: abortController.signal,
    });
  } catch (err) {
    if (err.name !== 'AbortError') {
      logger.error({ event: 'groq_stream_failed', userId, message: err.message }, 'Groq streaming failed');
      res.write(`data: ${JSON.stringify({ error: 'The response was interrupted. Please try again.' })}\n\n`);
    }
    userMessageInsert.catch(() => {}); // avoid an unhandled rejection; already fired, not on the critical path here
    res.end();
    return;
  }

  res.write('data: [DONE]\n\n');
  res.end();

  // 5. Post-response bookkeeping — none of this can affect what the user
  //    already received, so failures here are logged, not thrown.
  const { error: userInsertErr } = await userMessageInsert;
  if (userInsertErr) {
    logger.error({ event: 'user_message_persist_failed', userId }, 'Failed to persist user message');
  }

  const approxTokens = Math.ceil(fullReply.length / 4);
  const isLongResponse = approxTokens > aiConfig.longResponseTokenThreshold;

  await supabaseAdmin.from('messages').insert({
    user_id: userId,
    role: 'assistant',
    content: fullReply,
    credits_cost: isLongResponse ? CREDIT_COSTS.long : 0, // base cost already charged above
  });

  if (isLongResponse) {
    // Best-effort extra charge for a long response — if the user is now at
    // 0 credits, we don't retroactively fail the reply they already got.
    chargeCredits(userClient, CREDIT_COSTS.long - CREDIT_COSTS.normal).catch((err) =>
      logger.warn({ event: 'long_response_surcharge_failed', userId }, err.message)
    );
  }

  recordInteraction(userId).catch((err) => logger.warn({ event: 'relationship_update_failed', userId }, err.message));

  extractAndStoreMemories(groqClient, aiConfig, userId, message, fullReply).catch((err) =>
    logger.warn({ event: 'memory_extraction_failed', userId }, err.message)
  );
});
