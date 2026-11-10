// Time-based one-time passwords (TOTP, RFC 6238) for two-factor sign-in, plus
// single-use backup codes. The secret returned here is encrypted before storage
// (see crypto.ts); backup codes are stored only as hashes.
import { authenticator } from 'otplib';
import { randomBytes } from 'node:crypto';
import { sha256 } from './tokens.js';

const ISSUER = 'Baitward';

// Allow the previous/next 30-second step, to tolerate small clock drift.
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

// The otpauth:// URI an authenticator app reads from a QR code.
export function totpKeyUri(accountEmail: string, secret: string): string {
  return authenticator.keyuri(accountEmail, ISSUER, secret);
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.trim(), secret });
  } catch {
    return false;
  }
}

export type GeneratedBackupCodes = {
  // Shown to the user once, never stored.
  plaintext: string[];
  // Stored in place of the plaintext.
  hashes: string[];
};

// Produces human-friendly codes like "3f9a-c1d2".
export function generateBackupCodes(count = 10): GeneratedBackupCodes {
  const plaintext: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString('hex'); // 8 hex chars
    plaintext.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return { plaintext, hashes: plaintext.map((c) => hashBackupCode(c)) };
}

export function hashBackupCode(code: string): string {
  return sha256(code.trim().toLowerCase());
}
