import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

async function main() {
  const email = "demo@sitepulse.dev";
  const password = "demo1234";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.event.deleteMany();
  await prisma.dailyRollup.deleteMany();
  await prisma.site.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Demo User",
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Demo Agency",
      members: {
        create: { userId: user.id, role: "owner" },
      },
    },
  });

  const demoKey = "sp_demo_site_key_0001";
  const site = await prisma.site.create({
    data: {
      name: "Demo Site",
      domain: "demo.example.com",
      publicKey: demoKey,
      identityMode: "first_party_cookie",
      ipTruncate: true,
      retentionDays: 90,
      orgId: org.id,
    },
  });

  const cookielessSite = await prisma.site.create({
    data: {
      name: "Cookieless Demo",
      domain: "privacy.example.com",
      publicKey: "sp_demo_cookieless_0002",
      identityMode: "cookieless",
      ipTruncate: true,
      retentionDays: 90,
      orgId: org.id,
    },
  });

  const now = Date.now();
  const paths = ["/", "/pricing", "/docs", "/blog/hello", "/contact"];
  const sessions = Array.from({ length: 8 }, () => nanoid());
  const visitors = Array.from({ length: 5 }, () => nanoid());

  const events = [];
  for (let i = 0; i < 40; i++) {
    const createdAt = new Date(now - i * 60 * 60 * 1000);
    const path = paths[i % paths.length];
    const sessionId = sessions[i % sessions.length];
    const visitorId = visitors[i % visitors.length];
    events.push({
      type: "pageview",
      path,
      title: `Page ${path}`,
      referrer: i % 3 === 0 ? "https://google.com/" : null,
      utmSource: i % 5 === 0 ? "newsletter" : null,
      utmMedium: i % 5 === 0 ? "email" : null,
      utmCampaign: i % 5 === 0 ? "launch" : null,
      visitorId,
      sessionId,
      deviceClass: i % 4 === 0 ? "mobile" : "desktop",
      country: "XX",
      ipTruncated: "203.0.113.0",
      userAgent: "SitePulseSeed/1.0",
      createdAt,
      siteId: site.id,
    });
  }

  await prisma.event.createMany({ data: events });

  // Daily rollups for last 7 days
  for (let d = 0; d < 7; d++) {
    const date = new Date(now - d * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await prisma.dailyRollup.create({
      data: {
        siteId: site.id,
        date,
        pageviews: 20 + ((7 - d) * 3) % 17,
        sessions: 8 + ((7 - d) * 2) % 9,
        uniques: 5 + ((7 - d) * 1) % 6,
      },
    });
  }

  console.log("Seeded SitePulse demo:");
  console.log(`  Login: ${email} / ${password}`);
  console.log(`  Demo site key: ${demoKey}`);
  console.log(`  Cookieless site key: ${cookielessSite.publicKey}`);
  console.log(`  Org: ${org.name} (${org.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
