import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

async function main() {
  const email = "demo@sitepulse.dev";
  const password = "demo1234";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.conversion.deleteMany();
  await prisma.conversionGoal.deleteMany();
  await prisma.funnelStep.deleteMany();
  await prisma.funnel.deleteMany();
  await prisma.event.deleteMany();
  await prisma.dailyRollup.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sharedLink.deleteMany();
  await prisma.siteAccess.deleteMany();
  await prisma.invite.deleteMany();
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

  const month = new Date().toISOString().slice(0, 7);
  const org = await prisma.organization.create({
    data: {
      name: "Demo Agency",
      brandDisplayName: "Demo Agency Analytics",
      brandLogoUrl: "https://sitespulse.netlify.app/favicon.ico",
      digestEnabled: true,
      spikeMultiplier: 3,
      plan: "dev",
      pageviewLimit: 1_000_000,
      pageviewsUsed: 120,
      quotaMonth: month,
      softWarningPct: 90,
      billingStatus: "none",
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
      requireConsent: true,
      ipTruncate: true,
      retentionDays: 90,
      orgId: org.id,
    },
  });

  const urlGoal = await prisma.conversionGoal.create({
    data: {
      siteId: site.id,
      name: "Thank-you page",
      type: "url",
      matchValue: "/thanks",
      matchMode: "exact",
    },
  });

  const eventGoal = await prisma.conversionGoal.create({
    data: {
      siteId: site.id,
      name: "Signup complete",
      type: "event",
      matchValue: "signup_complete",
      matchMode: "exact",
    },
  });

  await prisma.funnel.create({
    data: {
      siteId: site.id,
      name: "Pricing → Contact → Thanks",
      steps: {
        create: [
          {
            name: "Landing",
            order: 0,
            type: "url",
            matchValue: "/",
            matchMode: "exact",
          },
          {
            name: "Pricing",
            order: 1,
            type: "url",
            matchValue: "/pricing",
            matchMode: "exact",
          },
          {
            name: "Thanks",
            order: 2,
            type: "url",
            matchValue: "/thanks",
            matchMode: "exact",
          },
        ],
      },
    },
  });

  const now = Date.now();
  const paths = ["/", "/pricing", "/docs", "/blog/hello", "/contact", "/thanks"];
  const sessions = Array.from({ length: 12 }, () => nanoid());
  const visitors = Array.from({ length: 8 }, () => nanoid());

  const events: Prisma.EventCreateManyInput[] = [];

  // Funnel-shaped sessions: first 6 go / → /pricing → /thanks
  for (let s = 0; s < 6; s++) {
    const base = now - s * 3 * 60 * 60 * 1000;
    const sessionId = sessions[s];
    const visitorId = visitors[s % visitors.length];
    const utm =
      s % 2 === 0
        ? { utmSource: "newsletter", utmMedium: "email", utmCampaign: "launch" }
        : { utmSource: "google", utmMedium: "cpc", utmCampaign: "brand" };

    for (const [idx, path] of ["/", "/pricing", "/thanks"].entries()) {
      // only first 4 complete thanks; 5-6 drop after pricing
      if (path === "/thanks" && s >= 4) continue;
      events.push({
        type: "pageview",
        path,
        title: `Page ${path}`,
        referrer: idx === 0 ? "https://google.com/" : null,
        ...utm,
        visitorId,
        sessionId,
        deviceClass: s % 3 === 0 ? "mobile" : "desktop",
        country: "XX",
        ipTruncated: "203.0.113.0",
        userAgent: "SitePulseSeed/1.0",
        createdAt: new Date(base + idx * 60 * 1000),
        siteId: site.id,
      });
    }
  }

  // Extra noise pageviews
  for (let i = 0; i < 24; i++) {
    const createdAt = new Date(now - i * 90 * 60 * 1000);
    const path = paths[i % paths.length];
    events.push({
      type: "pageview",
      path,
      title: `Page ${path}`,
      referrer: i % 3 === 0 ? "https://google.com/" : null,
      utmSource: i % 4 === 0 ? "twitter" : null,
      utmMedium: i % 4 === 0 ? "social" : null,
      utmCampaign: i % 4 === 0 ? "thread" : null,
      visitorId: visitors[i % visitors.length],
      sessionId: sessions[6 + (i % 6)],
      deviceClass: i % 4 === 0 ? "mobile" : "desktop",
      country: "XX",
      ipTruncated: "203.0.113.0",
      userAgent: "SitePulseSeed/1.0",
      createdAt,
      siteId: site.id,
    });
  }

  // Custom events (signup_complete) for event goal
  for (let i = 0; i < 5; i++) {
    events.push({
      type: "event",
      path: "/signup",
      eventName: "signup_complete",
      title: "Signup",
      utmSource: i % 2 === 0 ? "newsletter" : "google",
      utmMedium: i % 2 === 0 ? "email" : "cpc",
      utmCampaign: "launch",
      visitorId: visitors[i % visitors.length],
      sessionId: sessions[i],
      deviceClass: "desktop",
      country: "XX",
      ipTruncated: "203.0.113.0",
      userAgent: "SitePulseSeed/1.0",
      createdAt: new Date(now - i * 5 * 60 * 60 * 1000),
      siteId: site.id,
    });
  }

  await prisma.event.createMany({ data: events });

  // Conversions from URL goal (thanks pageviews in funnel sessions 0-3)
  for (let s = 0; s < 4; s++) {
    await prisma.conversion.create({
      data: {
        goalId: urlGoal.id,
        siteId: site.id,
        visitorId: visitors[s % visitors.length],
        sessionId: sessions[s],
        path: "/thanks",
        utmSource: s % 2 === 0 ? "newsletter" : "google",
        utmMedium: s % 2 === 0 ? "email" : "cpc",
        utmCampaign: s % 2 === 0 ? "launch" : "brand",
        createdAt: new Date(now - s * 3 * 60 * 60 * 1000 + 2 * 60 * 1000),
      },
    });
  }

  // Event conversions (unique sessions — use sessions that didn't collide with url for variety)
  for (let i = 0; i < 5; i++) {
    await prisma.conversion.create({
      data: {
        goalId: eventGoal.id,
        siteId: site.id,
        visitorId: visitors[i % visitors.length],
        sessionId: sessions[i],
        path: "/signup",
        eventName: "signup_complete",
        utmSource: i % 2 === 0 ? "newsletter" : "google",
        utmMedium: i % 2 === 0 ? "email" : "cpc",
        utmCampaign: "launch",
        createdAt: new Date(now - i * 5 * 60 * 60 * 1000),
      },
    });
  }

  // Spread a few more URL conversions across last 7 days for trends
  for (let d = 0; d < 7; d++) {
    await prisma.conversion.create({
      data: {
        goalId: urlGoal.id,
        siteId: site.id,
        visitorId: visitors[d % visitors.length],
        sessionId: nanoid(),
        path: "/thanks",
        utmSource: d % 2 === 0 ? "newsletter" : null,
        utmMedium: d % 2 === 0 ? "email" : null,
        utmCampaign: d % 2 === 0 ? "launch" : null,
        createdAt: new Date(now - d * 24 * 60 * 60 * 1000),
      },
    });
  }

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

  // Client user with read-only access to Demo Site only
  const client = await prisma.user.create({
    data: {
      email: "client@sitepulse.dev",
      passwordHash: await bcrypt.hash("client1234", 10),
      name: "Demo Client",
      memberships: {
        create: {
          role: "client",
          orgId: org.id,
          siteAccess: { create: [{ siteId: site.id }] },
        },
      },
    },
  });

  const inviteToken = "sp_demo_invite_token_0001";
  await prisma.invite.create({
    data: {
      email: "pending-client@example.com",
      token: inviteToken,
      role: "client",
      siteIds: JSON.stringify([site.id]),
      invitedBy: user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      orgId: org.id,
    },
  });

  const shareToken = "sp_demo_share_token_0001";
  await prisma.sharedLink.create({
    data: {
      token: shareToken,
      scope: "site",
      label: "Demo site share",
      createdBy: user.id,
      orgId: org.id,
      siteId: site.id,
    },
  });

  await prisma.sharedLink.create({
    data: {
      token: "sp_demo_share_org_0001",
      scope: "org",
      label: "Demo portfolio share",
      createdBy: user.id,
      orgId: org.id,
    },
  });

  await prisma.notification.create({
    data: {
      orgId: org.id,
      type: "digest_weekly",
      title: "Weekly digest · seed",
      body: "Seeded sample digest notification. Run npm run digest:weekly -- --force to refresh.",
      meta: JSON.stringify({ seeded: true }),
    },
  });

  console.log("Seeded SitePulse demo (top5 features):");
  console.log(`  Owner: ${email} / ${password}`);
  console.log(`  Client: client@sitepulse.dev / client1234 (Demo Site only)`);
  console.log(`  Pending invite: /invite/${inviteToken}`);
  console.log(`  Site share: /share/${shareToken}`);
  console.log(`  Org share: /share/sp_demo_share_org_0001`);
  console.log(`  Demo site key: ${demoKey}`);
  console.log(`  Cookieless site key: ${cookielessSite.publicKey}`);
  console.log(`  Goals: ${urlGoal.name}, ${eventGoal.name}`);
  console.log(`  Org: ${org.name} (${org.id}) plan=${org.plan}`);
  void client;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
