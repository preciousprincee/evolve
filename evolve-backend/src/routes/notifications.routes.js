import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, generalLimiter);

// List own notifications (RLS-scoped) — most recent first.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await req.userClient
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: { message: 'Failed to load notifications.', code: 'NOTIFICATIONS_LOAD_FAILED' } });
    res.status(200).json({ notifications: data });
  })
);

const idParamSchema = z.object({ id: z.string().uuid() });

// Mark a notification as read — RLS ensures this can only touch the
// caller's own row (the update policy checks auth.uid() = user_id).
router.patch(
  '/:id/read',
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { data, error } = await req.userClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: { message: 'Notification not found.', code: 'NOTIFICATION_NOT_FOUND' } });
    res.status(200).json({ notification: data });
  })
);

export default router;
