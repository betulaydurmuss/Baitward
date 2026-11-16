// Processes a one-off preview send: compose a template with sample data and send it
// to the requesting admin's own address, so they can see exactly what a recipient
// would receive before launching a campaign. Nothing is tracked or recorded — this
// is a dry run, so the token is a throwaway and no events are written.
import type { Job } from 'bullmq';
import { randomBytes } from 'node:crypto';
import { prisma } from './prisma.js';
import { transporter } from './mailer.js';
import { compose } from './compose.js';
import { workerEnv } from './env.js';

export type PreviewJob = { templateId: string; orgId: string; toEmail: string };

export async function processPreview(job: Job<PreviewJob>): Promise<void> {
  const { templateId, orgId, toEmail } = job.data;

  const template = await prisma.emailTemplate.findFirst({
    where: { id: templateId, orgId },
    select: { subject: true, html: true },
  });
  if (!template) return; // template vanished or not in this org — nothing to send

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  // A sample recipient built from the admin's own address, so personalisation shows.
  const sampleName = toEmail.split('@')[0] ?? 'there';
  const { subject, html } = compose({
    subject: template.subject,
    html: template.html,
    target: {
      email: toEmail,
      firstName: sampleName,
      lastName: null,
      department: 'Sample',
    },
    companyName: org?.name ?? 'Your company',
    token: `preview-${randomBytes(8).toString('hex')}`,
    apiBaseUrl: workerEnv.API_BASE_URL,
  });

  await transporter.sendMail({
    from: workerEnv.MAIL_FROM,
    to: toEmail,
    subject: `[TEST] ${subject}`,
    html,
  });
}
