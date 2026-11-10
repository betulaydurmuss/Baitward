// Target (employee) CRUD, scoped to the caller's organisation. Targets are the
// people a campaign may be sent to; one organisation can never see or address
// another's, because every query is filtered by orgId.
import { Prisma, type PrismaClient, type Locale } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { validateTargetsCsv } from './csv.js';

const MAX_IMPORT_ROWS = 1000;

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

    // Step 1 of import: parse and validate, writing nothing. The caller shows the
    // user which rows are valid and why the rest are not.
    importPreview(csv: string) {
      return validateTargetsCsv(csv);
    },

    // Step 2: re-validate on the server (never trusting the client) and create the
    // valid rows in a single transaction. Rows whose email already exists are skipped.
    async importCommit(orgId: string, csv: string) {
      const { rows, validCount } = validateTargetsCsv(csv);
      if (validCount === 0) throw new AppError(400, 'no_valid_rows', 'No valid rows to import');
      if (validCount > MAX_IMPORT_ROWS) {
        throw new AppError(
          400,
          'too_many_rows',
          `At most ${MAX_IMPORT_ROWS} rows can be imported at once`,
        );
      }

      const data = rows
        .filter((r): r is Extract<typeof r, { valid: true }> => r.valid)
        .map((r) => ({ orgId, ...r.data }));

      const result = await prisma.target.createMany({ data, skipDuplicates: true });
      return {
        created: result.count,
        skipped: validCount - result.count,
        invalid: rows.length - validCount,
      };
    },
  };
}
