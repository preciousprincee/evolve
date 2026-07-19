import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.validators.js';
import { getMyProfile, patchMyProfile } from '../controllers/profileController.js';

const router = Router();

// Every route here requires a verified session — no exceptions.
router.use(requireAuth, generalLimiter);

router.get('/me', getMyProfile);
router.patch('/me', validate(updateProfileSchema), patchMyProfile);

export default router;
