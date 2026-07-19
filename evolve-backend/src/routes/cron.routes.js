import { Router } from 'express';
import { requireCronSecret } from '../middleware/cronAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateGreetingNotifications,
  generateInactivityNotifications,
  generateBirthdayNotifications,
} from '../services/dailyMomentsService.js';

// Schedule externally (Railway Cron Jobs or GitHub Actions), e.g.:
//   0 8  * * *  -> POST /api/cron/good-morning
//   0 22 * * *  -> POST /api/cron/good-night
//   0 9  * * *  -> POST /api/cron/inactivity-check
//   0 9  * * *  -> POST /api/cron/birthday-check
// Each call must include header: X-Cron-Secret: <CRON_SECRET>

const router = Router();
router.use(requireCronSecret);

router.post(
  '/good-morning',
  asyncHandler(async (req, res) => {
    const count = await generateGreetingNotifications('good_morning');
    res.status(200).json({ notificationsCreated: count });
  })
);

router.post(
  '/good-night',
  asyncHandler(async (req, res) => {
    const count = await generateGreetingNotifications('good_night');
    res.status(200).json({ notificationsCreated: count });
  })
);

router.post(
  '/inactivity-check',
  asyncHandler(async (req, res) => {
    const count = await generateInactivityNotifications();
    res.status(200).json({ notificationsCreated: count });
  })
);

router.post(
  '/birthday-check',
  asyncHandler(async (req, res) => {
    const count = await generateBirthdayNotifications();
    res.status(200).json({ notificationsCreated: count });
  })
);

export default router;
