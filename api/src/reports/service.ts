// Report generation and retrieval. Generating a report builds its data, renders
// HTML, converts it to a PDF on disk and records a row. The PDF bytes live under
// storage/ (gitignored), referenced by filename.
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Locale, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { buildCampaignReportData } from './data.js';
import { renderReportHtml } from './html.js';
import { htmlToPdf } from './pdf.js';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'reports');

export function createReportService(prisma: PrismaClient) {
  return {
    async generate(orgId: string, input: { campaignId: string; locale: Locale }) {
      const data = await buildCampaignReportData(prisma, orgId, input.campaignId);
      const html = renderReportHtml(data, input.locale);
      const pdf = await htmlToPdf(html);

      await fs.mkdir(STORAGE_DIR, { recursive: true });
      const filename = `${randomUUID()}.pdf`;
      await fs.writeFile(path.join(STORAGE_DIR, filename), pdf);

      return prisma.report.create({
        data: { orgId, campaignId: input.campaignId, locale: input.locale, filePath: filename },
      });
    },

    list(orgId: string) {
      return prisma.report.findMany({
        where: { orgId },
        orderBy: { generatedAt: 'desc' },
        include: { campaign: { select: { template: { select: { name: true } } } } },
      });
    },

    async getPdf(orgId: string, id: string) {
      const report = await prisma.report.findFirst({ where: { id, orgId } });
      if (!report) throw new AppError(404, 'not_found', 'Report not found');
      const buffer = await fs.readFile(path.join(STORAGE_DIR, report.filePath));
      return { buffer, filename: `baitward-report-${report.id}.pdf` };
    },
  };
}
