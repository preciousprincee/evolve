import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../validators/chat.validators.js';
import { sendMessage } from '../controllers/chatController.js';

const router = Router();

router.use(requireAuth);
router.post('/message', chatLimiter, validate(sendMessageSchema), sendMessage);

export default router;
