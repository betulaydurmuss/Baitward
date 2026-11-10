// Landing-page CRUD, scoped to the organisation. A landing page is a generic fake
// page (never a real brand) shown when a recipient clicks. Its HTML is SSRF-checked
// before storage, like email templates.
import type { Locale, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { assertTemplateUrlsSafe } from '../lib/ssrf.js';

export type LandingInput = {
  name: string;
  locale: Locale;
  html: string;
  capturesSubmit: boolean;
  trainingId?: string | null;
};

export function createLandingService(prisma: PrismaClient) {
  async function assertTrainingInOrg(orgId: string, trainingId: string | null | undefined) {
    if (!trainingId) return;
    const found = await prisma.trainingModule.findFirst({
      where: { id: trainingId, orgId },
      select: { id: true },
    });
    if (!found) throw new AppError(400, 'bad_training', 'Training module not found');
  }

  return {
    list(orgId: string) {
      return prisma.landingPage.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    },

    async get(orgId: string, id: string) {
      const page = await prisma.landingPage.findFirst({ where: { id, orgId } });
      if (!page) throw new AppError(404, 'not_found', 'Landing page not found');
      return page;
    },

    async create(orgId: string, input: LandingInput) {
      await assertTemplateUrlsSafe(input.html);
      await assertTrainingInOrg(orgId, input.trainingId);
      return prisma.landingPage.create({ data: { orgId, ...input } });
    },

    async update(orgId: string, id: string, input: Partial<LandingInput>) {
      await this.get(orgId, id);
      if (input.html !== undefined) await assertTemplateUrlsSafe(input.html);
      if (input.trainingId !== undefined) await assertTrainingInOrg(orgId, input.trainingId);
      return prisma.landingPage.update({ where: { id }, data: input });
    },

    async remove(orgId: string, id: string) {
      await this.get(orgId, id);
      await prisma.landingPage.delete({ where: { id } });
    },
  };
}
