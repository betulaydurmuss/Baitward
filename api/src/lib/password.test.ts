import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toContain('correct horse'); // never stores plaintext
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
    expect(await verifyPassword(hash, 'wrong password')).toBe(false);
  });

  it('treats a malformed hash as a non-match instead of throwing', async () => {
    expect(await verifyPassword('not-a-real-hash', 'anything')).toBe(false);
  });
});
