import { prisma } from "./prisma";
import { createNotification } from "./notifications";
import { emailConfigured, sendMail } from "./email";
import { snapshotFromOrg, ensureQuotaWindow } from "./quota";

export type SiteDigest = {
  siteId: string;
  name: string;
  domain: string;
  pageviews: number;
  pageviewsPrev: number;
  conversions: number;
  conversionsPrev: number;
  topPath: string | null;
  topPathCount: number;
};

export type OrgDigest = {
  orgId: string;
  orgName: string;
  weekStart: string;
  weekEnd: string;
  sites: SiteDigest[];
  totalPageviews: number;
  totalConversions: number;
  quota: {
    used: number;
    limit: number;
    usagePct: number;
    softWarning: boolean;
  } | null;
};

function weekWindow(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return { start, end, prevStart, prevEnd: start };
}

export async function buildOrgDigest(orgId: string): Promise<OrgDigest | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { sites: { orderBy: { createdAt: "asc" } } },
  });
  if (!org) return null;

  const { start, end, prevStart, prevEnd } = weekWindow();
  const sites: SiteDigest[] = [];

  for (const site of org.sites) {
    const [pageviews, pageviewsPrev, conversions, conversionsPrev, top] =
      await Promise.all([
        prisma.event.count({
          where: {
            siteId: site.id,
            type: "pageview",
            createdAt: { gte: start, lt: end },
          },
        }),
        prisma.event.count({
          where: {
            siteId: site.id,
            type: "pageview",
            createdAt: { gte: prevStart, lt: prevEnd },
          },
        }),
        prisma.conversion.count({
          where: { siteId: site.id, createdAt: { gte: start, lt: end } },
        }),
        prisma.conversion.count({
          where: {
            siteId: site.id,
            createdAt: { gte: prevStart, lt: prevEnd },
          },
        }),
        prisma.event.groupBy({
          by: ["path"],
          where: {
            siteId: site.id,
            type: "pageview",
            createdAt: { gte: start, lt: end },
          },
          _count: { path: true },
          orderBy: { _count: { path: "desc" } },
          take: 1,
        }),
      ]);

    sites.push({
      siteId: site.id,
      name: site.name,
      domain: site.domain,
      pageviews,
      pageviewsPrev,
      conversions,
      conversionsPrev,
      topPath: top[0]?.path ?? null,
      topPathCount: top[0]?._count.path ?? 0,
    });
  }

  const quotaOrg = await ensureQuotaWindow(orgId);
  const snap = quotaOrg ? snapshotFromOrg(quotaOrg) : null;

  return {
    orgId: org.id,
    orgName: org.name,
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
    sites,
    totalPageviews: sites.reduce((a, s) => a + s.pageviews, 0),
    totalConversions: sites.reduce((a, s) => a + s.conversions, 0),
    quota: snap
      ? {
          used: snap.pageviewsUsed,
          limit: snap.pageviewLimit,
          usagePct: snap.usagePct,
          softWarning: snap.softWarning,
        }
      : null,
  };
}

function deltaLabel(curr: number, prev: number): string {
  if (prev === 0) return curr === 0 ? "—" : "+∞ vs prior week";
  const pct = Math.round(((curr - prev) / prev) * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs prior week`;
}

export function formatDigestText(digest: OrgDigest): string {
  const lines: string[] = [
    `SitePulse weekly digest — ${digest.orgName}`,
    `Week ${digest.weekStart} → ${digest.weekEnd}`,
    "",
    `Portfolio: ${digest.totalPageviews} pageviews, ${digest.totalConversions} conversions`,
  ];
  if (digest.quota) {
    lines.push(
      `Quota: ${digest.quota.used.toLocaleString()} / ${digest.quota.limit.toLocaleString()} PV (${digest.quota.usagePct}%)`
    );
  }
  lines.push("");
  for (const s of digest.sites) {
    lines.push(`• ${s.name} (${s.domain})`);
    lines.push(
      `  PV ${s.pageviews} (${deltaLabel(s.pageviews, s.pageviewsPrev)}) · Conv ${s.conversions} (${deltaLabel(s.conversions, s.conversionsPrev)})`
    );
    if (s.topPath) {
      lines.push(`  Top page: ${s.topPath} (${s.topPathCount})`);
    }
  }
  lines.push("");
  lines.push(
    "Privacy-honest note: numbers reflect first-party tracking only; adblock and consent opt-outs lower counts."
  );
  return lines.join("\n");
}

export async function deliverWeeklyDigest(orgId: string, opts?: { force?: boolean }) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        where: { role: { in: ["owner", "admin"] } },
        include: { user: { select: { email: true } } },
      },
    },
  });
  if (!org) return { skipped: true as const, reason: "org_not_found" as const };
  if (!org.digestEnabled && !opts?.force) {
    return { skipped: true as const, reason: "digest_disabled" as const };
  }

  // Avoid duplicate digests within ~6 days unless forced
  if (
    !opts?.force &&
    org.lastDigestAt &&
    Date.now() - org.lastDigestAt.getTime() < 6 * 24 * 60 * 60 * 1000
  ) {
    return { skipped: true as const, reason: "recently_sent" as const };
  }

  const digest = await buildOrgDigest(orgId);
  if (!digest) return { skipped: true as const, reason: "build_failed" as const };

  const text = formatDigestText(digest);
  const notification = await createNotification({
    orgId,
    type: "digest_weekly",
    title: `Weekly digest · ${digest.weekStart}`,
    body: text,
    meta: {
      weekStart: digest.weekStart,
      weekEnd: digest.weekEnd,
      totalPageviews: digest.totalPageviews,
      totalConversions: digest.totalConversions,
    },
  });

  const emails = org.members.map((m) => m.user.email);
  const mail = await sendMail({
    to: emails,
    subject: `[SitePulse] Weekly digest — ${org.name}`,
    text,
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { lastDigestAt: new Date() },
  });

  return {
    skipped: false as const,
    notificationId: notification.id,
    mail,
    emailConfigured: emailConfigured(),
    digest,
  };
}

/** Check today vs 7d average for spike; create in-app (+ optional email) once per day. */
export async function checkTrafficSpike(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      sites: true,
      members: {
        where: { role: { in: ["owner", "admin"] } },
        include: { user: { select: { email: true } } },
      },
    },
  });
  if (!org) return { spikes: [] as const };

  if (
    org.lastSpikeNotifiedAt &&
    Date.now() - org.lastSpikeNotifiedAt.getTime() < 20 * 60 * 60 * 1000
  ) {
    return { spikes: [] as const, skipped: "cooldown" as const };
  }

  const multiplier = org.spikeMultiplier || 3;
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const spikes: {
    siteId: string;
    name: string;
    today: number;
    avg: number;
  }[] = [];

  for (const site of org.sites) {
    const [today, weekPv] = await Promise.all([
      prisma.event.count({
        where: {
          siteId: site.id,
          type: "pageview",
          createdAt: { gte: dayStart },
        },
      }),
      prisma.event.count({
        where: {
          siteId: site.id,
          type: "pageview",
          createdAt: { gte: weekAgo, lt: dayStart },
        },
      }),
    ]);
    const avg = weekPv / 7;
    if (avg >= 5 && today >= avg * multiplier) {
      spikes.push({
        siteId: site.id,
        name: site.name,
        today,
        avg: Math.round(avg * 10) / 10,
      });
    }
  }

  if (spikes.length === 0) return { spikes: [] as const };

  const body = spikes
    .map(
      (s) =>
        `${s.name}: ${s.today} PV today vs ~${s.avg}/day avg (×${multiplier} rule)`
    )
    .join("\n");

  const notification = await createNotification({
    orgId,
    type: "traffic_spike",
    title: `Traffic spike · ${spikes.length} site(s)`,
    body,
    meta: { spikes, multiplier },
  });

  await sendMail({
    to: org.members.map((m) => m.user.email),
    subject: `[SitePulse] Traffic spike — ${org.name}`,
    text: `Traffic spike detected:\n\n${body}\n\nIn-app: Notifications.`,
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { lastSpikeNotifiedAt: new Date() },
  });

  return { spikes, notificationId: notification.id };
}

/** Fire quota warning notification once when crossing soft threshold. */
export async function maybeNotifyQuota(orgId: string) {
  const org = await ensureQuotaWindow(orgId);
  if (!org) return null;
  const snap = snapshotFromOrg(org);
  if (!snap.softWarning && !snap.hardExceeded) return null;

  if (
    org.lastQuotaNotifiedAt &&
    org.quotaMonth &&
    // one warning per quota month unless hard exceeded after prior soft
    org.lastQuotaNotifiedAt.toISOString().slice(0, 7) === org.quotaMonth &&
    !snap.hardExceeded
  ) {
    return null;
  }

  // Allow a second notice when hard exceeded after soft was already sent this month
  if (
    snap.hardExceeded &&
    org.lastQuotaNotifiedAt &&
    Date.now() - org.lastQuotaNotifiedAt.getTime() < 60 * 60 * 1000
  ) {
    return null;
  }

  const title = snap.hardExceeded
    ? "Quota exceeded — ingest paused"
    : `Quota warning — ${snap.usagePct}% used`;
  const body = `${snap.planLabel}: ${snap.pageviewsUsed.toLocaleString()} / ${snap.pageviewLimit.toLocaleString()} pageviews this month (${snap.usagePct}%). ${
    snap.hardExceeded
      ? "New pageviews are rejected (HTTP 429) until the next cycle or a plan upgrade."
      : "You are at or above the soft warning threshold."
  }`;

  const owners = await prisma.membership.findMany({
    where: { orgId, role: { in: ["owner", "admin"] } },
    include: { user: { select: { email: true } } },
  });

  const notification = await createNotification({
    orgId,
    type: "quota_warning",
    title,
    body,
    meta: {
      usagePct: snap.usagePct,
      used: snap.pageviewsUsed,
      limit: snap.pageviewLimit,
      hardExceeded: snap.hardExceeded,
    },
  });

  await sendMail({
    to: owners.map((m) => m.user.email),
    subject: `[SitePulse] ${title}`,
    text: body,
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { lastQuotaNotifiedAt: new Date() },
  });

  return notification;
}
