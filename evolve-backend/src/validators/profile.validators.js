import { z } from 'zod';

// Bounded, explicit limits on every field — never trust an unbounded string
// or array from the client. Free-text fields are capped to sane lengths to
// prevent abuse (e.g. someone pasting megabytes into "career").
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    nickname: z.string().trim().min(1).max(50).optional(),
    age: z.number().int().min(13).max(120).optional(),
    career: z.string().trim().max(120).optional(),
    goals: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    hobbies: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    personality: z.string().trim().max(500).optional(),
    love_language: z
      .enum(['words_of_affirmation', 'acts_of_service', 'receiving_gifts', 'quality_time', 'physical_touch'])
      .optional(),
    companion_style: z.enum(['supportive', 'motivational', 'playful', 'calm', 'direct']).optional(),
    current_mood: z.string().trim().max(30).optional(),
  })
  .strict() // reject unknown fields outright rather than silently dropping them
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field is required.' });
