import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { listUsersQuerySchema, userIdParamSchema } from '../validators/admin.validators.js';
import { getUsers, getUser } from '../controllers/adminController.js';

const router = Router();

// Every route here requires a verified session AND an admin role.
router.use(requireAuth, requireAdmin, adminLimiter);

router.get('/users', validate(listUsersQuerySchema, 'query'), getUsers);
router.get('/users/:userId', validate(userIdParamSchema, 'params'), getUser);

export default router;
