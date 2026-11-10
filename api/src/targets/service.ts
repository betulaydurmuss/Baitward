// Target (employee) CRUD, scoped to the caller's organisation. Targets are the
// people a campaign may be sent to; one organisation can never see or address
// another's, because every query is filtered by orgId.
import { Prisma, type PrismaClient, type Locale } from '@prisma/client';
import { AppError } from '../lib/http-error.js';

export type TargetInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  department?: string | null;
  locale: Locale;
  groups?: string[];
};

export function createTargetService(prisma: PrismaClient) {
  return {
    list(orgId: string) {
      return prisma.target.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    },

    async get(orgId: string, id: string) {
      const target = await prisma.target.findFirst({ where: { id, orgId } });
      if (!target) throw new AppError(404, 'not_found', 'Target not found');
      return target;
    },

    async create(orgId: string, input: TargetInput) {
      try {
        return await prisma.target.create({
          data: { orgId, ...input, email: input.email.toLowerCase() },
        });
      } catch (err) {
        // Unique violation on (orgId, email).
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new AppError(409, 'email_taken', 'A target with this email already exists');
        }
        throw err;
      }
    },

    async update(orgId: string, id: string, input: Partial<TargetInput>) {
      await this.get(orgId, id);
      const data = input.email ? { ...input, email: input.email.toLowerCase() } : input;
      return prisma.target.update({ where: { id }, data });
    },

    async remove(orgId: string, id: string) {
      await this.get(orgId, id);
      await prisma.target.delete({ where: { id } });
    },
  };
}
