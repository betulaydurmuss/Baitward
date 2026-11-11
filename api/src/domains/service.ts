// Domain-ownership verification. An organisation proves it controls a domain by
// adding a DNS TXT record containing a unique token. Until a domain is verified, the
// organisation cannot launch a campaign — which stops sending to addresses it does
// not own.
import dns from 'node:dns/promises';
import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { writeAudit } from '../lib/audit.js';
import { generateOpaqueToken } from '../lib/tokens.js';
import { env } from '../env.js';

type Actor = { actorId: string; ip?: string };

export function createDomainService(prisma: PrismaClient) {
  async function requireDomain(orgId: string, id: string) {
    const domain = await prisma.domainVerification.findFirst({ where: { id, orgId } });
    if (!domain) throw new AppError(404, 'not_found', 'Domain not found');
    return domain;
  }

  async function markVerified(orgId: string, domain: { id: string; domain: string }, actor: Actor) {
    await prisma.$transaction([
      prisma.domainVerification.update({
        where: { id: domain.id },
        data: { verifiedAt: new Date() },
      }),
      prisma.organization.update({ where: { id: orgId }, data: { verifiedDomain: domain.domain } }),
    ]);
    await writeAudit(prisma, {
      orgId,
      actorId: actor.actorId,
      action: 'domain.verified',
      target: domain.domain,
      ip: actor.ip,
    });
    return { verified: true };
  }

  return {
    list(orgId: string) {
      return prisma.domainVerification.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
      });
    },

    async add(orgId: string, domain: string, actor: Actor) {
      const normalized = domain.trim().toLowerCase();
      try {
        const record = await prisma.domainVerification.create({
          data: { orgId, domain: normalized, token: generateOpaqueToken(), method: 'dns' },
        });
        await writeAudit(prisma, {
          orgId,
          actorId: actor.actorId,
          action: 'domain.added',
          target: normalized,
          ip: actor.ip,
        });
        return record;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new AppError(409, 'domain_exists', 'This domain is already added');
        }
        throw err;
      }
    },

    // Checks the domain's TXT records for the verification token.
    async verify(orgId: string, id: string, actor: Actor) {
      const domain = await requireDomain(orgId, id);
      if (domain.verifiedAt) return { verified: true };

      let records: string[][] = [];
      try {
        records = await dns.resolveTxt(domain.domain);
      } catch {
        throw new AppError(
          400,
          'dns_lookup_failed',
          'Could not read DNS TXT records for this domain',
        );
      }
      const found = records.some((parts) =>
        parts.join('').includes(`baitward-verify=${domain.token}`),
      );
      if (!found) {
        throw new AppError(400, 'not_verified', 'TXT record not found yet. Add it and try again.');
      }
      return markVerified(orgId, domain, actor);
    },

    // Development-only shortcut so a domain can be verified without real DNS. Disabled
    // in production, where only the DNS check above is accepted.
    async devVerify(orgId: string, id: string, actor: Actor) {
      if (env.NODE_ENV === 'production') {
        throw new AppError(403, 'forbidden', 'Not available in production');
      }
      const domain = await requireDomain(orgId, id);
      return markVerified(orgId, domain, actor);
    },

    async remove(orgId: string, id: string) {
      const domain = await requireDomain(orgId, id);
      await prisma.domainVerification.delete({ where: { id: domain.id } });
      // If the removed domain was the org's verified one, clear it.
      await prisma.organization.updateMany({
        where: { id: orgId, verifiedDomain: domain.domain },
        data: { verifiedDomain: null },
      });
    },

    // The TXT record the user must add to prove ownership.
    txtRecord(token: string): string {
      return `baitward-verify=${token}`;
    },
  };
}
