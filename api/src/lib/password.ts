// Password hashing with Argon2id — a memory-hard algorithm that resists GPU
// cracking. We never store or log a plaintext password; only the hash from
// `hashPassword` is persisted, and `verifyPassword` checks a candidate against it.
import { hash, verify } from '@node-rs/argon2';

// Parameters chosen for interactive logins: strong but fast enough for a request.
const OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain, OPTIONS);
  } catch {
    // A malformed hash should read as "does not match", never crash the request.
    return false;
  }
}
