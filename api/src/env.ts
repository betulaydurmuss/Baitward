// Validate configuration at startup so a misconfigured deployment fails loudly
// and early, instead of misbehaving at request time. Every value is parsed and
// typed through zod; defaults mirror the local docker-compose setup.
import 'dotenv/config';
import { z } from 'zod';

// Development-only secrets. They let a fresh clone run without ceremony, but the
// schema below refuses to start in production while they are still in place.
const DEV_ACCESS_SECRET = 'dev-access-secret-change-me-in-production-0000';
const DEV_TOTP_KEY = 'dev-totp-encryption-key-change-me-in-prod-0000';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    API_PORT: z.coerce.number().int().positive().default(4000),
    API_BASE_URL: z.string().url().default('http://localhost:4000'),
    WEB_ORIGIN: z.string().url().default('http://localhost:5180'),

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

    // Signs short-lived access tokens. At least 32 characters.
    AUTH_ACCESS_SECRET: z.string().min(32).default(DEV_ACCESS_SECRET),
    // Passphrase from which the TOTP-secret encryption key is derived.
    TOTP_ENC_KEY: z.string().min(16).default(DEV_TOTP_KEY),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== 'production') return;
    if (cfg.AUTH_ACCESS_SECRET === DEV_ACCESS_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_ACCESS_SECRET'],
        message: 'must be set to a real secret in production',
      });
    }
    if (cfg.TOTP_ENC_KEY === DEV_TOTP_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TOTP_ENC_KEY'],
        message: 'must be set to a real secret in production',
      });
    }
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Flatten keeps the message readable: one line per offending variable.
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;

// The cookie carrying the refresh token is only marked Secure in production, so
// that http://localhost still works in development.
export const COOKIE_SECURE = env.NODE_ENV === 'production';
