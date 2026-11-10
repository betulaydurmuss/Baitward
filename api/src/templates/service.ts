// Email-template CRUD, always scoped to the caller's organisation. Before a
// template is stored, any external URL in its HTML is checked against the SSRF
// guard, so a template cannot be used to point the server at an internal address.
import type { PrismaClient, Difficulty, Locale } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { assertTemplateUrlsSafe } from '../lib/ssrf.js';

export type TemplateInput = {
  name: string;
  locale: Locale;
  subject: string;
  html: string;
  difficulty: Difficulty;
  category?: string | null;
};

export function createTemplateService(prisma: PrismaClient) {
  return {
    list(orgId: string) {
      return prisma.emailTemplate.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
      });
    },

    async get(orgId: string, id: string) {
      const template = await prisma.emailTemplate.findFirst({ where: { id, orgId } });
      if (!template) throw new AppError(404, 'not_found', 'Template not found');
      return template;
    },

    async create(orgId: string, input: TemplateInput) {
      await assertTemplateUrlsSafe(input.html);
      return prisma.emailTemplate.create({ data: { orgId, ...input } });
    },

    async update(orgId: string, id: string, input: Partial<TemplateInput>) {
      // Confirm ownership before touching anything.
      await this.get(orgId, id);
      if (input.html !== undefined) await assertTemplateUrlsSafe(input.html);
      return prisma.emailTemplate.update({ where: { id }, data: input });
    },

    async remove(orgId: string, id: string) {
      await this.get(orgId, id);
      await prisma.emailTemplate.delete({ where: { id } });
    },
  };
}
