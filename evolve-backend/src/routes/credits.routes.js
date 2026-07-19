import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  generalLimiter,
  asyncHandler(async (req, res) => {
    // Read-only, RLS-scoped. There is no write route here by design —
    // balance changes exclusively through the deduct_credits() RPC.
    const { data, error } = await req.userClient.from('credits').select('balance, cycle_reset_at').eq('user_id', req.userId).single();
    if (error) return res.status(404).json({ error: { message: 'Credits not found.', code: 'CREDITS_NOT_FOUND' } });
    res.status(200).json(data);
  })
);

export default router;
