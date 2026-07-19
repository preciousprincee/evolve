import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty.').max(4000, 'Message is too long (max 4000 characters).'),
});
