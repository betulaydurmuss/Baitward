// SMTP transport. In development this points at Mailpit, which captures every
// message instead of delivering it — so simulated phishing mail is never actually
// sent to a real inbox during development.
import nodemailer from 'nodemailer';
import { workerEnv } from './env.js';

export const transporter = nodemailer.createTransport({
  host: workerEnv.SMTP_HOST,
  port: workerEnv.SMTP_PORT,
  secure: false,
  auth: workerEnv.SMTP_USER ? { user: workerEnv.SMTP_USER, pass: workerEnv.SMTP_PASS } : undefined,
});
