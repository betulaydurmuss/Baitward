// Scheduled monthly digest: for every organisation with activity, email its admins
// a short summary of the last period. The full audit PDF is generated on demand in
// the app; this keeps leadership informed without anyone having to log in.
import type { EventType } from '@prisma/client';
import { prisma } from './prisma.js';
import { transporter } from './mailer.js';
import { workerEnv } from './env.js';

// Distinct recipients who reached at least a given stage — a small, local funnel.
function stageCount(
  events: { campaignTargetId: string; type: EventType }[],
  types: EventType[],
): number {
  const ids = new Set<string>();
  for (const e of events) if (types.includes(e.type)) ids.add(e.campaignTargetId);
  return ids.size;
}

export async function runScheduledDigest(): Promise<number> {
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      users: { where: { role: 'org_admin' }, select: { email: true } },
    },
  });

  let sentCount = 0;
  for (const org of orgs) {
    const recipients = org.users.map((u) => u.email);
    if (recipients.length === 0) continue;

    const sent = await prisma.campaignTarget.count({
      where: { campaign: { orgId: org.id }, sentAt: { not: null } },
    });
    if (sent === 0) continue; // nothing to report yet

    const events = await prisma.event.findMany({
      where: { campaignTarget: { campaign: { orgId: org.id } } },
      select: { campaignTargetId: true, type: true },
    });
    const clicked = stageCount(events, ['clicked', 'submitted']);
    const submitted = stageCount(events, ['submitted']);
    const reported = stageCount(events, ['reported']);

    await transporter.sendMail({
      from: workerEnv.MAIL_FROM,
      to: recipients.join(', '),
      subject: `Baitward — monthly awareness summary for ${org.name}`,
      html: `<p>Here is your organisation's phishing-awareness summary.</p>
        <ul>
          <li>Emails sent: <strong>${sent}</strong></li>
          <li>Clicked: <strong>${clicked}</strong></li>
          <li>Submitted data: <strong>${submitted}</strong></li>
          <li>Reported the phish: <strong>${reported}</strong></li>
        </ul>
        <p>Sign in to Baitward to generate the full audit-ready PDF report.</p>`,
    });
    sentCount += 1;
  }
  return sentCount;
}
