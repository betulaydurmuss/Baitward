// Symmetric encryption for secrets that must be read back (specifically the TOTP
// secret). AES-256-GCM gives confidentiality and integrity; the key is derived
// from TOTP_ENC_KEY so the raw passphrase length does not matter.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../env.js';

const KEY = createHash('sha256').update(env.TOTP_ENC_KEY).digest(); // 32 bytes
const IV_LENGTH = 12; // GCM standard nonce size

// Returns base64 of iv | authTag | ciphertext.
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decrypt(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = data.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
