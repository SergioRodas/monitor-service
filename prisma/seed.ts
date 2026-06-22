import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Sergio's real, public services — so the board shows truthful data. */
const seedMonitors = [
  {
    name: 'Portfolio',
    url: 'https://sergiorodas.vercel.app',
    intervalSeconds: 300,
  },
  {
    name: 'Portfolio (ES)',
    url: 'https://sergiorodas.vercel.app/es/',
    intervalSeconds: 300,
  },
  {
    name: 'mcp-dev-workflow (npm)',
    url: 'https://registry.npmjs.org/@sergiorodas/mcp-dev-workflow',
    intervalSeconds: 600,
  },
  {
    name: 'GitHub profile',
    url: 'https://github.com/SergioRodas',
    intervalSeconds: 600,
  },
];

async function main(): Promise<void> {
  for (const m of seedMonitors) {
    const existing = await prisma.monitor.findFirst({ where: { url: m.url } });
    if (existing) {
      console.log(`• exists: ${m.name}`);
      continue;
    }
    await prisma.monitor.create({ data: m });
    console.log(`✓ created: ${m.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
