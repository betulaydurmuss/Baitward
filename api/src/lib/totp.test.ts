import { describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import {
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  totpKeyUri,
  verifyTotp,
} from './totp.js';

describe('TOTP', () => {
  it('verifies a freshly generated code and rejects a wrong one', () => {
    const secret = generateTotpSecret();
    const code = authenticator.generate(secret);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, '000000')).toBe(false);
  });

  it('builds a provisioning URI naming the issuer and account', () => {
    const uri = totpKeyUri('user@demo.example', generateTotpSecret());
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('Baitward');
    // The account email is percent-encoded in the URI (@ becomes %40).
    expect(decodeURIComponent(uri)).toContain('user@demo.example');
  });
});

describe('backup codes', () => {
  it('generates ten codes whose hashes verify', () => {
    const { plaintext, hashes } = generateBackupCodes();
    expect(plaintext).toHaveLength(10);
    expect(hashes).toHaveLength(10);
    expect(hashBackupCode(plaintext[0]!)).toBe(hashes[0]);
    expect(hashBackupCode('0000-0000')).not.toBe(hashes[0]);
  });
});
