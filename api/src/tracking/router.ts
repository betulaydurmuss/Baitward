// Public tracking endpoints hit by the recipient's mail client and browser. They
// carry only an opaque token — never a name or email — and require no auth. Mounted
// at the root (/t, /c, /s) so the links embedded in emails stay short.
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createTrackingService } from './service.js';
import { asyncHandler } from '../lib/async-handler.js';
import { getClientIp, getUserAgent } from '../lib/request.js';
import { renderTemplate } from '../lib/render.js';
import { env } from '../env.js';

const trainingUrl = (token: string) => `${env.WEB_ORIGIN}/training/${token}`;

// A 1x1 transparent GIF, returned by the open-tracking pixel.
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// Where a recipient lands after clicking or submitting. The full training page
// arrives in Phase 4; for now it is a short awareness page in the web app.
const AWARENESS_URL = `${env.WEB_ORIGIN}/caught`;

export function createTrackingRouter(prisma: PrismaClient): Router {
  const tracking = createTrackingService(prisma);
  const router = Router();

  const meta = (req: Parameters<typeof getClientIp>[0]) => ({
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  // Open pixel — records the open, then returns the transparent GIF.
  router.get(
    '/t/:token',
    asyncHandler(async (req, res) => {
      await tracking.recordOpen(req.params.token!, meta(req));
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, must-revalidate');
      res.send(PIXEL);
    }),
  );

  // Click — records the click, then shows the campaign's landing page if it has one
  // (its form posts to /s/:token). With no landing page, go straight to training.
  router.get(
    '/c/:token',
    asyncHandler(async (req, res) => {
      const token = req.params.token!;
      await tracking.recordClick(token, meta(req));

      const ctx = await tracking.loadContext(token);
      const landing = ctx?.campaign.landingPage;
      if (ctx && landing) {
        const html = renderTemplate(landing.html, {
          first_name: ctx.target.firstName ?? '',
          last_name: ctx.target.lastName ?? '',
          department: ctx.target.department ?? '',
          company: ctx.campaign.org.name,
          email: ctx.target.email,
          // The form action and the onward training link, filled in per recipient.
          submit_url: `${env.API_BASE_URL}/s/${token}`,
          training_url: trainingUrl(token),
        });
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        return;
      }
      res.redirect(302, trainingUrl(token));
    }),
  );

  // Submit — records that a fake form was submitted. The request body is never read
  // or stored; only the event and technical metadata are kept. Then: training.
  router.post(
    '/s/:token',
    asyncHandler(async (req, res) => {
      await tracking.recordSubmit(req.params.token!, meta(req));
      res.redirect(302, trainingUrl(req.params.token!));
    }),
  );

  // Report — the most positive behaviour: the recipient flagged the mail as phishing.
  router.get(
    '/r/:token',
    asyncHandler(async (req, res) => {
      await tracking.recordReport(req.params.token!, meta(req));
      res.redirect(302, `${AWARENESS_URL}?reported=1`);
    }),
  );

  return router;
}
