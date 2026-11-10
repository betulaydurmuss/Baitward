import { describe, expect, it } from 'vitest';
import { encrypt, decrypt } from './crypto.js';

describe('AES-256-GCM encryption', () => {
  it('round-trips a value', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encoded = encrypt(secret);
    expect(encoded).not.toContain(secret);
    expect(decrypt(encoded)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encrypt('same input')).not.toBe(encrypt('same input'));
  });

  it('rejects tampered ciphertext', () => {
    const encoded = encrypt('tamper me');
    const bytes = Buffer.from(encoded, 'base64');
    const last = bytes.length - 1;
    bytes[last] = (bytes[last] ?? 0) ^ 0x01; // flip a bit in the ciphertext
    expect(() => decrypt(bytes.toString('base64'))).toThrow();
  });
});
