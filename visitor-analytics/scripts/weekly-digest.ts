/**
 * Weekly digest + spike/quota alert runner.
 * Usage: npm run digest:weekly [-- --org ORG_ID] [-- --force] [-- --dry-run]
 *
 * Without RESEND_API_KEY / SMTP_HOST: builds digests, writes in-app notifications, logs email stub.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  checkTrafficSpike,
  deliverWeeklyDigest,
  maybeNotifyQuota,
} from "../src/lib/digest";

const prisma = new PrismaClient();

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const onlyOrg = arg("--org");

  const orgs = await prisma.organization.findMany({
    where: onlyOrg ? { id: onlyOrg } : undefined,
    select: { id: true, name: true, digestEnabled: true },
  });

  console.log(
    `SitePulse digest run · ${orgs.length} org(s) · dryRun=${dryRun} force=${force}`
  );

  for (const org of orgs) {
    console.log(`\n— ${org.name} (${org.id}) digestEnabled=${org.digestEnabled}`);
    if (dryRun) {
      const { buildOrgDigest, formatDigestText } = await import(
        "../src/lib/digest"
      );
      const d = await buildOrgDigest(org.id);
      if (d) console.log(formatDigestText(d));
      continue;
    }

    const digest = await deliverWeeklyDigest(org.id, { force });
    console.log("digest:", digest);

    const spike = await checkTrafficSpike(org.id);
    console.log("spike:", spike);

    const quota = await maybeNotifyQuota(org.id);
    console.log("quota:", quota ? { id: quota.id, title: quota.title } : null);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
