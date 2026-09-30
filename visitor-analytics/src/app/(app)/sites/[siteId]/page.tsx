import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  assertSiteAccess,
  canWrite,
  getSession,
  getUserOrg,
} from "@/lib/auth";
import { dateKey, daysAgo } from "@/lib/conversions";
import { prisma } from "@/lib/prisma";
import { ConversionStats } from "@/components/conversion-stats";
import { FunnelsPanel } from "@/components/funnels-panel";
import { GoalsPanel } from "@/components/goals-panel";
import { SiteSettingsForm } from "@/components/site-settings-form";
import { ExportPanel } from "@/components/export-panel";
import { SnippetInstall } from "@/components/snippet-install";
import { VisitorStream } from "@/components/visitor-stream";

function buildTrend(
  conversions: { createdAt: Date }[],
  days: number
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    map.set(dateKey(daysAgo(i)), 0);
  }
  for (const c of conversions) {
    const k = dateKey(c.createdAt);
    if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { siteId } = await params;

  const site = await assertSiteAccess(session.id, siteId);
  if (!site) notFound();
  const membership = await getUserOrg(session.id);
  const write = membership ? canWrite(membership.role) : false;

  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const [
    rollups,
    recentEvents,
    topPages,
    pageviews30d,
    sessions,
    uniques,
    goals,
    funnels,
    conversions30,
    conversions7,
  ] = await Promise.all([
    prisma.dailyRollup.findMany({
      where: { siteId, date: { gte: since30.toISOString().slice(0, 10) } },
      orderBy: { date: "asc" },
    }),
    prisma.event.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.event.groupBy({
      by: ["path"],
      where: { siteId, type: "pageview", createdAt: { gte: since30 } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
    prisma.event.count({
      where: { siteId, type: "pageview", createdAt: { gte: since30 } },
    }),
    prisma.event.findMany({
      where: { siteId, createdAt: { gte: since30 } },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
    prisma.event.findMany({
      where: { siteId, createdAt: { gte: since30 } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    prisma.conversionGoal.findMany({
      where: { siteId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.funnel.findMany({
      where: { siteId },
      include: { steps: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.conversion.findMany({
      where: { siteId, createdAt: { gte: since30 } },
      include: { goal: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversion.findMany({
      where: { siteId, createdAt: { gte: since7 } },
      select: { createdAt: true },
    }),
  ]);

  const maxPv = Math.max(1, ...rollups.map((r) => r.pageviews));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const byGoal30 = goals.map((g) => ({
    goalId: g.id,
    name: g.name,
    type: g.type,
    count: conversions30.filter((c) => c.goalId === g.id).length,
  }));

  const utmMap = new Map<string, number>();
  for (const c of conversions30) {
    const key = c.utmSource
      ? `${c.utmSource}${c.utmMedium ? ` / ${c.utmMedium}` : ""}${c.utmCampaign ? ` / ${c.utmCampaign}` : ""}`
      : "(none)";
    utmMap.set(key, (utmMap.get(key) || 0) + 1);
  }
  const utmBreakdown = [...utmMap.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-[var(--muted)]">
          ← Dashboard
        </Link>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {site.name}
        </h1>
        <p className="text-[var(--muted)]">{site.domain}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Pageviews (30d)" value={String(pageviews30d)} />
        <Stat label="Sessions (30d)" value={String(sessions.length)} />
        <Stat label="Uniques (30d)" value={String(uniques.length)} />
        <Stat label="Conversions (30d)" value={String(conversions30.length)} />
      </div>

      <section className="sp-card p-5">
        <h2 className="text-lg font-semibold">Pageview / session trend</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Daily rollups (seeded demo data + live ingest).
        </p>
        {rollups.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No rollup data yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {rollups.map((r) => (
              <div
                key={r.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                title={`${r.date}: ${r.pageviews} PV, ${r.sessions} sessions`}
              >
                <div
                  className="w-full rounded-t bg-[var(--brand)] opacity-90 transition group-hover:opacity-100"
                  style={{
                    height: `${Math.max(8, (r.pageviews / maxPv) * 100)}%`,
                  }}
                />
                <span className="mt-1 hidden text-[10px] text-[var(--muted)] sm:block">
                  {r.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div>
        <h2
          className="mb-4 text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Conversions
        </h2>
        <ConversionStats
          total7={conversions7.length}
          total30={conversions30.length}
          trend7={buildTrend(conversions7, 7)}
          trend30={buildTrend(conversions30, 30)}
          byGoal30={byGoal30}
          utmBreakdown={utmBreakdown}
          recent={conversions30.slice(0, 15).map((c) => ({
            id: c.id,
            goalName: c.goal.name,
            goalType: c.goal.type,
            path: c.path,
            eventName: c.eventName,
            utmSource: c.utmSource,
            utmMedium: c.utmMedium,
            utmCampaign: c.utmCampaign,
            createdAt: c.createdAt,
          }))}
        />
      </div>

      <VisitorStream siteId={site.id} pollMs={8000} />

      {write ? (
        <>
          <GoalsPanel siteId={site.id} initialGoals={goals} />
          <FunnelsPanel siteId={site.id} initialFunnels={funnels} />
        </>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Client read-only view — goal and funnel edits are hidden.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="sp-card p-5">
          <h2 className="mb-3 text-lg font-semibold">Top pages</h2>
          {topPages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No pages yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topPages.map((p) => (
                <li
                  key={p.path}
                  className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2 last:border-0"
                >
                  <span className="truncate font-mono text-xs">{p.path}</span>
                  <span className="font-semibold">{p._count.path}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sp-card p-5">
          <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No recent events.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="border-b border-[var(--line)] pb-2 last:border-0"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-xs">
                      {ev.type === "event"
                        ? `event:${ev.eventName}`
                        : ev.path}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {ev.createdAt.toISOString().slice(11, 19)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    visitor {ev.visitorId.slice(0, 8)}… ·{" "}
                    {ev.deviceClass ?? "unknown"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {write && (
        <>
          <SnippetInstall appUrl={appUrl} siteKey={site.publicKey} />
          <SiteSettingsForm
            siteId={site.id}
            initial={{
              name: site.name,
              domain: site.domain,
              identityMode: site.identityMode,
              requireConsent: site.requireConsent,
              ipTruncate: site.ipTruncate,
              retentionDays: site.retentionDays,
              publicKey: site.publicKey,
            }}
          />
          <ExportPanel siteId={site.id} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sp-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p
        className="mt-1 text-3xl font-semibold"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {value}
      </p>
    </div>
  );
}
