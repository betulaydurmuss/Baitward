// IP-based rate limiting for the sensitive auth endpoints, a second line of defence
// alongside per-account lockout. It blunts online password guessing spread across
// many accounts from one source.
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many attempts, try again later' } },
});
