// Validate configuration at startup so a misconfigured deployment fails loudly
// and early, instead of misbehaving at request time. Every value is parsed and
// typed through zod; defaults mirror the local docker-compose setup.
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://baitward:baitward@localhost:5432/baitward?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Baitward <no-reply@baitward.local>'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Flatten keeps the message readable: one line per offending variable.
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
