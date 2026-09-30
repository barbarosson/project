import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { assertSiteAccess, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteSettingsForm } from "@/components/site-settings-form";
import { SnippetInstall } from "@/components/snippet-install";

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

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [rollups, recentEvents, topPages, pageviews30d, sessions, uniques] =
    await Promise.all([
      prisma.dailyRollup.findMany({
        where: { siteId, date: { gte: since.toISOString().slice(0, 10) } },
        orderBy: { date: "asc" },
      }),
      prisma.event.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.event.groupBy({
        by: ["path"],
        where: { siteId, createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      }),
      prisma.event.count({
        where: { siteId, createdAt: { gte: since } },
      }),
      prisma.event.findMany({
        where: { siteId, createdAt: { gte: since } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.event.findMany({
        where: { siteId, createdAt: { gte: since } },
        distinct: ["visitorId"],
        select: { visitorId: true },
      }),
    ]);

  const maxPv = Math.max(1, ...rollups.map((r) => r.pageviews));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pageviews (30d)" value={String(pageviews30d)} />
        <Stat label="Sessions (30d)" value={String(sessions.length)} />
        <Stat label="Uniques (30d)" value={String(uniques.length)} />
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
          <h2 className="mb-3 text-lg font-semibold">Recent visitors</h2>
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
                    <span className="font-mono text-xs">{ev.path}</span>
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

      <SnippetInstall appUrl={appUrl} siteKey={site.publicKey} />

      <SiteSettingsForm
        siteId={site.id}
        initial={{
          name: site.name,
          domain: site.domain,
          identityMode: site.identityMode,
          ipTruncate: site.ipTruncate,
          retentionDays: site.retentionDays,
          publicKey: site.publicKey,
        }}
      />
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
