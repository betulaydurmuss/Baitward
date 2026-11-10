// The authentication service. It owns every security-sensitive decision — password
// verification, account lockout, two-factor, session issuance and rotation — and
// knows nothing about HTTP (no cookies, no req/res). The router adapts it to HTTP.
//
// It takes its PrismaClient as an argument so tests can inject a fake and run
// without a database.
import type { Prisma, PrismaClient, Role, User } from '@prisma/client';
import { AppError, INVALID_CREDENTIALS } from '../lib/http-error.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import {
  generateOpaqueToken,
  sha256,
  signAccessToken,
  signPendingToken,
  verifyPendingToken,
  REFRESH_TOKEN_TTL_DAYS,
} from '../lib/tokens.js';
import {
  generateTotpSecret,
  totpKeyUri,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
} from '../lib/totp.js';
import { clearedState, isLocked, registerFailure } from '../lib/lockout.js';

// Two-factor is mandatory for administrators, optional for analysts.
function roleRequiresTwoFactor(role: Role): boolean {
  return role === 'org_admin' || role === 'super_admin';
}

export type PublicUser = {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  totpEnabled: boolean;
};

function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
    totpEnabled: user.totpEnabled,
  };
}

// What issuing a session hands back. The refresh token is plaintext here; the
// router puts it in an httpOnly cookie and never exposes it to JavaScript.
export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: PublicUser;
};

export type LoginResult =
  | { kind: 'authenticated'; session: IssuedSession }
  | { kind: 'twofactor'; pendingToken: string } // 2FA is on; enter a code
  | { kind: 'enroll'; pendingToken: string }; // admin without 2FA; must enrol first

export function createAuthService(prisma: PrismaClient) {
  async function issueSession(user: User, ip?: string, userAgent?: string): Promise<IssuedSession> {
    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: sha256(refreshToken),
        ip,
        userAgent,
        expiresAt,
      },
    });
    const accessToken = signAccessToken({ userId: user.id, orgId: user.orgId, role: user.role });
    return { accessToken, refreshToken, expiresAt, user: publicUser(user) };
  }

  return {
    // Public sign-up: creates a new organisation and its first admin, then requires
    // that admin to enrol into two-factor before they get a session.
    async register(input: { orgName: string; email: string; password: string }) {
      const email = input.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError(409, 'email_taken', 'An account with this email already exists');
      }
      const passwordHash = await hashPassword(input.password);
      const user = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({ data: { name: input.orgName } });
        return tx.user.create({
          data: { orgId: org.id, email, passwordHash, role: 'org_admin' },
        });
      });
      return { userId: user.id, pendingToken: signPendingToken(user.id, 'enroll') };
    },

    async login(input: { email: string; password: string; ip?: string; userAgent?: string }) {
      const email = input.email.toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Spend comparable time to a real verification so a missing account cannot
        // be told apart by response timing.
        await hashPassword(input.password);
        throw INVALID_CREDENTIALS;
      }

      if (isLocked(user.lockedUntil)) {
        throw new AppError(423, 'account_locked', 'Account temporarily locked. Try again later.');
      }

      const ok = await verifyPassword(user.passwordHash, input.password);
      if (!ok) {
        const next = registerFailure(user.failedLogins);
        await prisma.user.update({ where: { id: user.id }, data: next });
        throw INVALID_CREDENTIALS;
      }

      // Correct password: wipe the failure counter.
      if (user.failedLogins !== 0 || user.lockedUntil !== null) {
        await prisma.user.update({ where: { id: user.id }, data: clearedState() });
      }

      if (user.totpEnabled) {
        return { kind: 'twofactor', pendingToken: signPendingToken(user.id, 'twofactor') } as const;
      }
      if (roleRequiresTwoFactor(user.role)) {
        return { kind: 'enroll', pendingToken: signPendingToken(user.id, 'enroll') } as const;
      }
      const session = await issueSession(user, input.ip, input.userAgent);
      return { kind: 'authenticated', session } as const;
    },

    // Second step for an account that already has 2FA enabled: accepts a TOTP code
    // or a one-time backup code, then issues the session.
    async verifyTwoFactor(input: {
      pendingToken: string;
      code: string;
      ip?: string;
      userAgent?: string;
    }): Promise<IssuedSession> {
      const claims = verifyPendingToken(input.pendingToken);
      if (claims.purpose !== 'twofactor') {
        throw new AppError(400, 'bad_pending_token', 'Unexpected verification step');
      }
      const user = await prisma.user.findUnique({ where: { id: claims.sub } });
      if (!user || !user.totpEnabled || !user.totpSecret) {
        throw INVALID_CREDENTIALS;
      }

      const secret = decrypt(user.totpSecret);
      if (!verifyTotp(secret, input.code)) {
        // Fall back to a single-use backup code.
        const codeHash = hashBackupCode(input.code);
        const backup = await prisma.backupCode.findFirst({
          where: { userId: user.id, codeHash, usedAt: null },
        });
        if (!backup) {
          throw new AppError(401, 'invalid_code', 'Invalid verification code');
        }
        await prisma.backupCode.update({ where: { id: backup.id }, data: { usedAt: new Date() } });
      }

      return issueSession(user, input.ip, input.userAgent);
    },

    // Begins 2FA setup: generates a secret, stores it encrypted (not yet enabled),
    // and returns the provisioning URI for a QR code.
    async setupTwoFactor(userId: string) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, 'not_found', 'User not found');
      const secret = generateTotpSecret();
      await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: encrypt(secret), totpEnabled: false },
      });
      return { secret, otpauthUrl: totpKeyUri(user.email, secret) };
    },

    // Confirms a setup code, enables 2FA, and issues fresh backup codes (returned
    // once). When the user is enrolling at sign-in, also issues the session.
    async enableTwoFactor(input: {
      userId: string;
      code: string;
      issueSessionAfter: boolean;
      ip?: string;
      userAgent?: string;
    }): Promise<{ backupCodes: string[]; session: IssuedSession | null }> {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!user || !user.totpSecret) {
        throw new AppError(400, 'no_pending_secret', 'Start two-factor setup first');
      }
      const secret = decrypt(user.totpSecret);
      if (!verifyTotp(secret, input.code)) {
        throw new AppError(401, 'invalid_code', 'Invalid verification code');
      }

      const { plaintext, hashes } = generateBackupCodes();
      const writes: Prisma.PrismaPromise<unknown>[] = [
        prisma.backupCode.deleteMany({ where: { userId: user.id } }),
        prisma.backupCode.createMany({
          data: hashes.map((codeHash) => ({ userId: user.id, codeHash })),
        }),
        prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } }),
      ];
      await prisma.$transaction(writes);

      const session = input.issueSessionAfter
        ? await issueSession({ ...user, totpEnabled: true }, input.ip, input.userAgent)
        : null;
      return { backupCodes: plaintext, session };
    },

    // Rotates the refresh token: the presented one is invalidated and a new one is
    // returned, along with a fresh access token.
    async refresh(input: { refreshToken?: string; ip?: string; userAgent?: string }) {
      if (!input.refreshToken) throw new AppError(401, 'no_session', 'Not authenticated');
      const session = await prisma.session.findFirst({
        where: { refreshTokenHash: sha256(input.refreshToken) },
        include: { user: true },
      });
      if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
        throw new AppError(401, 'invalid_session', 'Session expired, sign in again');
      }
      const newRefresh = generateOpaqueToken();
      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: sha256(newRefresh),
          lastUsedAt: new Date(),
          ip: input.ip,
          userAgent: input.userAgent,
        },
      });
      const accessToken = signAccessToken({
        userId: session.user.id,
        orgId: session.user.orgId,
        role: session.user.role,
      });
      return {
        accessToken,
        refreshToken: newRefresh,
        expiresAt: session.expiresAt,
        user: publicUser(session.user),
      };
    },

    async logout(refreshToken?: string) {
      if (!refreshToken) return;
      await prisma.session.updateMany({
        where: { refreshTokenHash: sha256(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    async me(userId: string) {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { org: true } });
      if (!user) throw new AppError(404, 'not_found', 'User not found');
      return {
        user: publicUser(user),
        org: {
          id: user.org.id,
          name: user.org.name,
          plan: user.org.plan,
          verifiedDomain: user.org.verifiedDomain,
        },
      };
    },

    async listSessions(userId: string, currentRefreshToken?: string) {
      const currentHash = currentRefreshToken ? sha256(currentRefreshToken) : null;
      const sessions = await prisma.session.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastUsedAt: 'desc' },
      });
      return sessions.map((s) => ({
        id: s.id,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        current: currentHash !== null && s.refreshTokenHash === currentHash,
      }));
    },

    async revokeSession(userId: string, sessionId: string) {
      const result = await prisma.session.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count === 0) throw new AppError(404, 'not_found', 'Session not found');
    },

    async revokeAllSessions(userId: string, exceptRefreshToken?: string) {
      const keepHash = exceptRefreshToken ? sha256(exceptRefreshToken) : undefined;
      await prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(keepHash ? { refreshTokenHash: { not: keepHash } } : {}),
        },
        data: { revokedAt: new Date() },
      });
    },

    // Returns a reset token when the email exists, otherwise null. The caller must
    // respond identically either way, so attackers cannot probe for valid emails.
    async createPasswordReset(email: string): Promise<string | null> {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) return null;
      const token = generateOpaqueToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: sha256(token),
          resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      return token;
    },

    async resetPassword(input: { token: string; newPassword: string }) {
      const user = await prisma.user.findFirst({
        where: {
          resetTokenHash: sha256(input.token),
          resetTokenExpiresAt: { gt: new Date() },
        },
      });
      if (!user) throw new AppError(400, 'invalid_token', 'Reset link is invalid or expired');
      const passwordHash = await hashPassword(input.newPassword);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            resetTokenHash: null,
            resetTokenExpiresAt: null,
            failedLogins: 0,
            lockedUntil: null,
          },
        }),
        // A password reset signs out every existing session.
        prisma.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
