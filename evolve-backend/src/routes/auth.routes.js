import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

// NOTE: Actual sign-up, login (email/password + Google), password reset,
// and anonymous/guest sign-in all happen on the FRONTEND directly via the
// Supabase client SDK — that's the correct, secure pattern for Supabase Auth
// and avoids us ever handling raw passwords. This backend never sees a
// password; it only ever verifies the JWT that Supabase issues afterward.
//
// This route exists so the frontend can confirm "does the backend accept
// my current session" (useful right after login, or to detect an expired
// token proactively rather than waiting for a 401 on some other action).
const router = Router();

router.get('/session', requireAuth, generalLimiter, (req, res) => {
  res.status(200).json({ userId: req.userId, isGuest: req.isGuest });
});

export default router;
