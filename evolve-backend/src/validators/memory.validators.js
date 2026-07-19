import { z } from 'zod';

const CATEGORIES = [
  'goal', 'dream', 'song', 'movie', 'book', 'birthday', 'friend', 'family',
  'achievement', 'fear', 'habit', 'career', 'study_progress',
  'health_preference', 'inside_joke', 'important_moment', 'other',
];

export const createMemorySchema = z.object({
  category: z.enum(CATEGORIES),
  content: z.string().trim().min(1).max(2000),
});

export const updateMemorySchema = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    content: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field is required.' });

export const listMemoriesQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
});

export const memoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid memory id.'),
});
