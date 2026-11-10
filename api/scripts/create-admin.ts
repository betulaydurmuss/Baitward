// Creates the first administrator for a new organisation, from the command line.
// The password is read with the echo turned off and is never written to the repo,
// to a log, or to this file. Run with: npm run admin:create --workspace=api
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';
import type { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

// A readline interface whose output we can silence while a password is typed.
type MutableRl = readline.Interface & {
  stdoutMuted?: boolean;
  output?: NodeJS.WriteStream;
  _writeToOutput?: (s: string) => void;
};

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Prints the prompt, then hides every character the user types.
function askPassword(rl: MutableRl, question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    rl.stdoutMuted = true;
    rl._writeToOutput = (str: string) => {
      if (!rl.stdoutMuted) rl.output?.write(str);
    };
    rl.question('', (value) => {
      rl.stdoutMuted = false;
      stdout.write('\n');
      resolve(value);
    });
  });
}

const schema = z.object({
  orgName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['super_admin', 'org_admin', 'security_analyst']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Collects the four inputs, preferring environment variables when they are all
// present (useful for scripting/CI), and otherwise prompting interactively.
async function collectInput() {
  const env = {
    orgName: process.env.ADMIN_ORG,
    email: process.env.ADMIN_EMAIL,
    role: process.env.ADMIN_ROLE,
    password: process.env.ADMIN_PASSWORD,
  };
  if (env.orgName && env.email && env.password) {
    return {
      orgName: env.orgName,
      email: env.email,
      roleInput: env.role?.trim() || 'org_admin',
      password: env.password,
    };
  }

  const rl: MutableRl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const orgName = await ask(rl, 'Organisation name: ');
    const email = await ask(rl, 'Admin email: ');
    const roleInput = (await ask(rl, 'Role [org_admin]: ')).trim() || 'org_admin';
    const password = await askPassword(rl, 'Password (hidden): ');
    return { orgName, email, roleInput, password };
  } finally {
    rl.close();
  }
}

async function main() {
  const { orgName, email, roleInput, password } = await collectInput();

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
