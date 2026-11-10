// Training-module CRUD, scoped to the organisation. The quiz is validated into the
// expected shape before storage.
import type { Locale, Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { parseQuiz, type QuizQuestion } from './quiz.js';

export type TrainingInput = {
  title: string;
  locale: Locale;
  content: string;
  quiz: QuizQuestion[];
};

export function createTrainingService(prisma: PrismaClient) {
  return {
    list(orgId: string) {
      return prisma.trainingModule.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    },

    async get(orgId: string, id: string) {
      const module = await prisma.trainingModule.findFirst({ where: { id, orgId } });
      if (!module) throw new AppError(404, 'not_found', 'Training module not found');
      return module;
    },

    async create(orgId: string, input: TrainingInput) {
      const quiz = parseQuiz(input.quiz);
      return prisma.trainingModule.create({
        data: {
          orgId,
          title: input.title,
          locale: input.locale,
          content: input.content,
          quiz: quiz as unknown as Prisma.InputJsonValue,
        },
      });
    },

    async update(orgId: string, id: string, input: Partial<TrainingInput>) {
      await this.get(orgId, id);
      const data: Prisma.TrainingModuleUpdateInput = {
        title: input.title,
        locale: input.locale,
        content: input.content,
      };
      if (input.quiz !== undefined) {
        data.quiz = parseQuiz(input.quiz) as unknown as Prisma.InputJsonValue;
      }
      return prisma.trainingModule.update({ where: { id }, data });
    },

    async remove(orgId: string, id: string) {
      await this.get(orgId, id);
      await prisma.trainingModule.delete({ where: { id } });
    },
  };
}
