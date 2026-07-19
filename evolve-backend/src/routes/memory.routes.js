import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  createMemorySchema,
  updateMemorySchema,
  listMemoriesQuerySchema,
  memoryIdParamSchema,
} from '../validators/memory.validators.js';
import { getMemories, postMemory, patchMemory, removeMemory } from '../controllers/memoryController.js';

const router = Router();

router.use(requireAuth, generalLimiter);

router.get('/', validate(listMemoriesQuerySchema, 'query'), getMemories);
router.post('/', validate(createMemorySchema), postMemory);
router.patch('/:id', validate(memoryIdParamSchema, 'params'), validate(updateMemorySchema), patchMemory);
router.delete('/:id', validate(memoryIdParamSchema, 'params'), removeMemory);

export default router;
