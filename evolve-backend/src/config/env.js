import 'dotenv/config';
import { z } from 'zod';

// Fail fast at boot if any required secret is missing or malformed, rather
// than discovering it later via a confusing runtime error mid-request.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS must list at least one origin'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  GROQ_API_KEY: z.string().min(10),
  CRON_SECRET: z.string().min(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Intentionally verbose ONLY on server boot logs, never sent to a client.
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  ALLOWED_ORIGINS: parsed.data.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  isProd: parsed.data.NODE_ENV === 'production',
};
