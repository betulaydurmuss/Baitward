// HTTP surface for authentication. Each handler validates its body with zod,
// delegates the decision to the auth service, and adapts the result to HTTP
// (status codes and the refresh-token cookie). No security logic lives here.
import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { env } from '../env.js';
import { createAuthService } from './service.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { verifyAccessToken, verifyPendingToken } from '../lib/tokens.js';
import {
  clearRefreshCookie,
  getClientIp,
  getRefreshCookie,
  getUserAgent,
  setRefreshCookie,
} from '../lib/request.js';
import QRCode from 'qrcode';

const registerSchema = z.object({
  orgName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
const codeSchema = z.object({ code: z.string().min(4).max(20) });
const verifyTwoFactorSchema = z.object({
  pendingToken: z.string(),
  code: z.string().min(4).max(20),
});
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string(), newPassword: z.string().min(8).max(200) });

export function createAuthRouter(prisma: PrismaClient): Router {
  const auth = createAuthService(prisma);
  const router = Router();

  // Resolves who is acting for the 2FA setup/enable routes: either a signed-in user
  // (access token) or someone enrolling at sign-in (pending "enroll" token).
  function resolveEnrolActor(req: Parameters<typeof requireAuth>[0]): {
    userId: string;
    viaPending: boolean;
  } {
    const header = req.get('authorization');
    if (header?.startsWith('Bearer ')) {
      try {
        const claims = verifyAccessToken(header.slice('Bearer '.length));
        return { userId: claims.sub, viaPending: false };
      } catch {
        throw new AppError(401, 'unauthorized', 'Invalid or expired token');
      }
    }
    const pending = (req.body as { pendingToken?: unknown }).pendingToken;
    if (typeof pending === 'string') {
      try {
        const claims = verifyPendingToken(pending);
        if (claims.purpose !== 'enroll') {
          throw new AppError(400, 'bad_pending_token', 'Unexpected enrolment step');
        }
        return { userId: claims.sub, viaPending: true };
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(401, 'unauthorized', 'Invalid or expired token');
      }
    }
    throw new AppError(401, 'unauthorized', 'Not authenticated');
  }

  router.post(
    '/register',
    authLimiter,
    asyncHandler(async (req, res) => {
      const body = registerSchema.parse(req.body);
      const result = await auth.register(body);
      // A new admin must enrol in 2FA before they receive a session.
      res.status(201).json({ enrollTwoFactor: true, pendingToken: result.pendingToken });
    }),
  );

  router.post(
    '/login',
    authLimiter,
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const result = await auth.login({
        ...body,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      if (result.kind === 'authenticated') {
        setRefreshCookie(res, result.session.refreshToken);
        res.json({ accessToken: result.session.accessToken, user: result.session.user });
        return;
      }
      if (result.kind === 'twofactor') {
        res.json({ twoFactorRequired: true, pendingToken: result.pendingToken });
        return;
      }
      res.json({ enrollTwoFactor: true, pendingToken: result.pendingToken });
    }),
  );

  router.post(
    '/2fa/verify',
    authLimiter,
    asyncHandler(async (req, res) => {
      const body = verifyTwoFactorSchema.parse(req.body);
      const session = await auth.verifyTwoFactor({
        ...body,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      setRefreshCookie(res, session.refreshToken);
      res.json({ accessToken: session.accessToken, user: session.user });
    }),
  );

  router.post(
    '/2fa/setup',
    asyncHandler(async (req, res) => {
      const { userId } = resolveEnrolActor(req);
      const { secret, otpauthUrl } = await auth.setupTwoFactor(userId);
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      res.json({ secret, otpauthUrl, qrDataUrl });
    }),
  );

  router.post(
    '/2fa/enable',
    asyncHandler(async (req, res) => {
      const { code } = codeSchema.parse(req.body);
      const { userId, viaPending } = resolveEnrolActor(req);
      const result = await auth.enableTwoFactor({
        userId,
        code,
        issueSessionAfter: viaPending,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      if (result.session) {
        setRefreshCookie(res, result.session.refreshToken);
        res.json({
          backupCodes: result.backupCodes,
          accessToken: result.session.accessToken,
          user: result.session.user,
        });
        return;
      }
      res.json({ backupCodes: result.backupCodes });
    }),
  );

  router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json(await auth.me(req.auth!.userId));
    }),
  );

  router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
      const result = await auth.refresh({
        refreshToken: getRefreshCookie(req),
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      setRefreshCookie(res, result.refreshToken);
      res.json({ accessToken: result.accessToken, user: result.user });
    }),
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      await auth.logout(getRefreshCookie(req));
      clearRefreshCookie(res);
      res.json({ ok: true });
    }),
  );

  router.get(
    '/sessions',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ sessions: await auth.listSessions(req.auth!.userId, getRefreshCookie(req)) });
    }),
  );

  router.delete(
    '/sessions/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const sessionId = req.params.id;
      if (!sessionId) throw new AppError(400, 'bad_request', 'Session id is required');
      await auth.revokeSession(req.auth!.userId, sessionId);
      res.json({ ok: true });
    }),
  );

  router.post(
    '/sessions/revoke-all',
    requireAuth,
    asyncHandler(async (req, res) => {
      await auth.revokeAllSessions(req.auth!.userId, getRefreshCookie(req));
      res.json({ ok: true });
    }),
  );

  router.post(
    '/forgot-password',
    authLimiter,
    asyncHandler(async (req, res) => {
      const { email } = forgotSchema.parse(req.body);
      const token = await auth.createPasswordReset(email);
      // Until the mail engine (Phase 2) is wired, surface the reset link in dev logs
      // so the flow is testable. The response is identical whether or not the email
      // exists, so it never reveals which addresses are registered.
      if (token && env.NODE_ENV !== 'production') {
        console.log(`[dev] password reset token for ${email}: ${token}`);
      }
      res.json({ ok: true });
    }),
  );

  router.post(
    '/reset-password',
    authLimiter,
    asyncHandler(async (req, res) => {
      const body = resetSchema.parse(req.body);
      await auth.resetPassword(body);
      res.json({ ok: true });
    }),
  );

  return router;
}
