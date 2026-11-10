// Creates the first administrator for a new organisation, from the command line.
// The password is read with the echo turned off and is never written to the repo,
// to a log, or to this file. Run with: npm run admin:create --workspace=api
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';
import type { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

// Reads a line without echoing the typed characters (for the password).
function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(value);
          break;
        case '\u0003': // Ctrl-C
          stdin.setRawMode?.(false);
          stdin.removeListener('data', onData);
          stdout.write('\n');
          reject(new Error('Cancelled'));
          break;
        case '\u007f': // Backspace
        case '\b':
          value = value.slice(0, -1);
          break;
        default:
          value += char;
      }
    };
    stdin.on('data', onData);
  });
}

const schema = z.object({
  orgName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['super_admin', 'org_admin', 'security_analyst']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const orgName = await rl.question('Organisation name: ');
  const email = await rl.question('Admin email: ');
  const roleInput = (await rl.question('Role [org_admin]: ')).trim() || 'org_admin';
  rl.close();

  const password = await readHidden('Password (hidden): ');

  const parsed = schema.safeParse({ orgName, email, role: roleInput, password });
  if (!parsed.success) {
    console.error('Invalid input:');
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    console.error('A user with that email already exists.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: parsed.data.orgName } });
    return tx.user.create({
      data: {
        orgId: org.id,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role as Role,
      },
    });
  });

  console.log(
    `\nCreated ${parsed.data.role} ${user.email} in organisation "${parsed.data.orgName}".`,
  );
  console.log('Two-factor is required at first sign-in; the app will prompt for enrolment.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });
