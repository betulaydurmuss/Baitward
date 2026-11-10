// Worker configuration. Defaults mirror the local docker-compose setup, so the
// worker runs on a fresh clone without a .env of its own.
import 'dotenv/config';

export const workerEnv = {
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://baitward:baitward@localhost:5432/baitward?schema=public',
  SMTP_HOST: process.env.SMTP_HOST ?? 'localhost',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 1025),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  MAIL_FROM: process.env.MAIL_FROM ?? 'Baitward <no-reply@baitward.local>',
  // Used to build per-recipient tracking URLs embedded in the email.
  API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:4000',
};
