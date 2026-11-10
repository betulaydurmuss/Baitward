// Seeds a demo organisation, two localised sample templates (TR and EN) and a few
// targets, so a fresh clone has something to look at. It is idempotent: fixed ids
// and upserts mean running it twice changes nothing.
//
// Note what is NOT seeded: no passwords and no captured form data. The first admin
// user is created later through the CLI, never checked into the repo.
import { PrismaClient, Locale, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'Demo Corp',
      plan: 'trial',
      verifiedDomain: 'demo.example',
    },
  });

  await prisma.emailTemplate.upsert({
    where: { id: 'demo-template-tr' },
    update: {},
    create: {
      id: 'demo-template-tr',
      orgId: org.id,
      name: 'Kargo teslim bildirimi',
      locale: Locale.tr,
      subject: 'Kargonuz teslim edilemedi',
      html: '<p>Merhaba {{first_name}}, kargonuz teslim edilemedi. Yeniden planlamak için bağlantıya tıklayın.</p>',
      difficulty: Difficulty.medium,
      category: 'shipping',
    },
  });

  await prisma.emailTemplate.upsert({
    where: { id: 'demo-template-en' },
    update: {},
    create: {
      id: 'demo-template-en',
      orgId: org.id,
      name: 'Delivery failure notice',
      locale: Locale.en,
      subject: 'Your parcel could not be delivered',
      html: '<p>Hi {{first_name}}, your parcel could not be delivered. Click the link to reschedule.</p>',
      difficulty: Difficulty.medium,
      category: 'shipping',
    },
  });

  const targets = [
    {
      email: 'ayse@demo.example',
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      department: 'Finance',
      locale: Locale.tr,
    },
    {
      email: 'mehmet@demo.example',
      firstName: 'Mehmet',
      lastName: 'Demir',
      department: 'IT',
      locale: Locale.tr,
    },
    {
      email: 'john@demo.example',
      firstName: 'John',
      lastName: 'Carter',
      department: 'Sales',
      locale: Locale.en,
    },
  ];

  for (const t of targets) {
    await prisma.target.upsert({
      where: { orgId_email: { orgId: org.id, email: t.email } },
      update: {},
      create: { orgId: org.id, ...t },
    });
  }

  console.log(`Seed complete: org "${org.name}", 2 templates, ${targets.length} targets.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
