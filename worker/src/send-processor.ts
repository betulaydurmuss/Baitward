// Processes one send job: compose the recipient's email, send it via SMTP, and
// record a single `sent` event. It is idempotent — a job that runs twice (e.g. a
// retry) does not send twice, because a row with sentAt is skipped.
import type { Job } from 'bullmq';
import { prisma } from './prisma.js';
import { transporter } from './mailer.js';
import { compose } from './compose.js';
import { workerEnv } from './env.js';

export type SendJob = { campaignTargetId: string };

export async function processSend(job: Job<SendJob>): Promise<void> {
  const ct = await prisma.campaignTarget.findUnique({
    where: { id: job.data.campaignTargetId },
    include: {
      target: true,
      campaign: { include: { template: true, org: true } },
    },
  });

  if (!ct || ct.sentAt) return; // already sent, or vanished — nothing to do

  const { subject, html } = compose({
    subject: ct.campaign.template.subject,
    html: ct.campaign.template.html,
    target: ct.target,
    companyName: ct.campaign.org.name,
    token: ct.token,
    apiBaseUrl: workerEnv.API_BASE_URL,
  });

  await transporter.sendMail({ from: workerEnv.MAIL_FROM, to: ct.target.email, subject, html });

  // Mark sent and record the event in one transaction.
  await prisma.$transaction([
    prisma.campaignTarget.update({ where: { id: ct.id }, data: { sentAt: new Date() } }),
    prisma.event.create({ data: { campaignTargetId: ct.id, type: 'sent' } }),
  ]);

  // When the last recipient has been sent to, mark the campaign complete.
  const remaining = await prisma.campaignTarget.count({
    where: { campaignId: ct.campaignId, sentAt: null },
  });
  if (remaining === 0) {
    await prisma.campaign.update({ where: { id: ct.campaignId }, data: { status: 'completed' } });
  }
}
