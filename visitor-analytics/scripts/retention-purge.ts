/**
 * Purge events (and orphan-like conversions older than retention) per site.
 *
 * Usage:
 *   npm run retention:purge
 *   npm run retention:purge -- --dry-run
 *
 * Uses each site's retentionDays (default 90). Does not claim "no personal data".
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const sites = await prisma.site.findMany({
    select: { id: true, name: true, retentionDays: true },
  });

  let totalEvents = 0;
  let totalConversions = 0;

  for (const site of sites) {
    const days = site.retentionDays || 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const eventCount = await prisma.event.count({
      where: { siteId: site.id, createdAt: { lt: cutoff } },
    });
    const convCount = await prisma.conversion.count({
      where: { siteId: site.id, createdAt: { lt: cutoff } },
    });

    console.log(
      `${site.name}: retention=${days}d cutoff=${cutoff.toISOString()} events=${eventCount} conversions=${convCount}`
    );

    if (!dryRun && (eventCount > 0 || convCount > 0)) {
      const delConv = await prisma.conversion.deleteMany({
        where: { siteId: site.id, createdAt: { lt: cutoff } },
      });
      const delEv = await prisma.event.deleteMany({
        where: { siteId: site.id, createdAt: { lt: cutoff } },
      });
      totalEvents += delEv.count;
      totalConversions += delConv.count;
    } else {
      totalEvents += eventCount;
      totalConversions += convCount;
    }
  }

  console.log(
    dryRun
      ? `Dry run: would delete ${totalEvents} events, ${totalConversions} conversions`
      : `Deleted ${totalEvents} events, ${totalConversions} conversions`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
