// Public endpoints that back the training page a recipient sees after clicking.
// Identified only by the opaque token. The quiz is served without its answers;
// scoring happens here on the server.
import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createTrackingService } from '../tracking/service.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';
import { getClientIp, getUserAgent } from '../lib/request.js';
import { parseQuiz, publicQuiz, scoreQuiz, type QuizQuestion } from './quiz.js';
import { DEFAULT_TRAINING } from './defaults.js';

const completeSchema = z.object({ answers: z.array(z.number().int()).max(50) });

export function createPublicTrainingRouter(prisma: PrismaClient): Router {
  const tracking = createTrackingService(prisma);
  const router = Router();

  // Resolves the quiz source for a token: the attached module, or the fallback.
  async function resolve(token: string) {
    const ctx = await tracking.loadContext(token);
    if (!ctx) throw new AppError(404, 'not_found', 'Unknown link');

    const trainingId = ctx.campaign.landingPage?.trainingId ?? null;
    if (trainingId) {
      const module = await prisma.trainingModule.findUnique({ where: { id: trainingId } });
      if (module) {
        return {
          ctx,
          moduleId: module.id,
          locale: module.locale,
          title: module.title,
          content: module.content,
          quiz: parseQuiz(module.quiz),
        };
      }
    }
    const fallback = DEFAULT_TRAINING[ctx.target.locale];
    return {
      ctx,
      moduleId: null as string | null,
      locale: ctx.target.locale,
      title: fallback.title,
      content: fallback.content,
      quiz: fallback.quiz as QuizQuestion[],
    };
  }

  router.get(
    '/:token',
    asyncHandler(async (req, res) => {
      const r = await resolve(req.params.token!);
      res.json({
        title: r.title,
        content: r.content,
        locale: r.locale,
        quiz: publicQuiz(r.quiz), // answers stripped
      });
    }),
  );

  router.post(
    '/:token/complete',
    asyncHandler(async (req, res) => {
      const { answers } = completeSchema.parse(req.body);
      const r = await resolve(req.params.token!);
      const result = scoreQuiz(r.quiz, answers);

      await tracking.recordTrained(req.params.token!, {
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      if (r.moduleId) {
        await prisma.trainingCompletion.create({
          data: {
            campaignTargetId: r.ctx.id,
            moduleId: r.moduleId,
            locale: r.locale,
            score: result.correct,
          },
        });
      }

      res.json(result);
    }),
  );

  return router;
}
