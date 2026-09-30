import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canManageTeam,
  canWrite,
  getSession,
  listAccessibleSites,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgQuota } from "@/lib/quota";
import { QuotaBanner } from "@/components/quota-banner";
import { VisitorStream } from "@/components/visitor-stream";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { membership, sites } = await listAccessibleSites(session.id);
  if (!membership) {
    return (
      <div className="sp-card max-w-lg space-y-4 p-6">
        <h1 className="text-2xl font-semibold">No organization</h1>
        <p className="text-[var(--muted)]">
          Something went wrong with your account setup. Try signing out and
          registering again, or contact support once live.
        </p>
        <div className="sp-row">
          <Link href="/" className="sp-btn sp-btn-ghost">
            Home
          </Link>
          <Link href="/register" className="sp-btn sp-btn-primary">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const write = canWrite(membership.role);
  const manage = canManageTeam(membership.role);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const siteIds = sites.map((s) => s.id);
  const quota = await getOrgQuota(membership.orgId);

  const [pv7d, conversions7d, siteStats] = await Promise.all([
    siteIds.length
      ? prisma.event.count({
          where: {
            siteId: { in: siteIds },
            type: "pageview",
            createdAt: { gte: since },
          },
        })
      : Promise.resolve(0),
    siteIds.length
      ? prisma.conversion.count({
          where: { siteId: { in: siteIds }, createdAt: { gte: since } },
        })
      : Promise.resolve(0),
    Promise.all(
      sites.map(async (site) => {
        const [pv, conv] = await Promise.all([
          prisma.event.count({
            where: {
              siteId: site.id,
              type: "pageview",
              createdAt: { gte: since },
            },
          }),
          prisma.conversion.count({
            where: { siteId: site.id, createdAt: { gte: since } },
          }),
        ]);
        return { site, pv, conv };
      })
    ),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {membership.org.name}
            {membership.role === "client" ? " · Client view" : ""}
          </p>
          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Portfolio
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {write && (
            <Link href="/sites/new" className="sp-btn sp-btn-primary">
              Add site
            </Link>
          )}
          {manage && (
            <Link href="/team" className="sp-btn sp-btn-ghost">
              Invite client
            </Link>
          )}
        </div>
      </div>

      {quota && (
        <QuotaBanner
          usagePct={quota.usagePct}
          used={quota.pageviewsUsed}
          limit={quota.pageviewLimit}
          softWarning={quota.softWarning}
          hardExceeded={quota.hardExceeded}
          planLabel={quota.planLabel}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Sites" value={String(sites.length)} />
        <Stat label="Pageviews (7d)" value={String(pv7d)} />
        <Stat label="Conversions (7d)" value={String(conversions7d)} />
        <Stat
          label="Plan"
          value={quota?.planLabel ?? membership.org.plan}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sites</h2>
          <Link
            href="/stream"
            className="text-sm font-semibold text-[var(--brand)]"
          >
            Open live stream →
          </Link>
        </div>
        {sites.length === 0 ? (
          <div className="sp-card space-y-3 p-6">
            <p className="font-semibold">No sites yet</p>
            <p className="text-sm text-[var(--muted)]">
              Add a client site to get a public key, install the snippet, and
              start seeing conversions.
            </p>
            <div className="sp-row">
              {write ? (
                <Link href="/sites/new" className="sp-btn sp-btn-primary">
                  Create your first site
                </Link>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Ask an org admin to grant you site access.
                </p>
              )}
              <Link href="/docs/install" className="sp-btn sp-btn-ghost">
                Install docs
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {siteStats.map(({ site, pv, conv }) => (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="sp-card block p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-xl font-semibold"
                      style={{
                        fontFamily: "var(--font-display), Georgia, serif",
                      }}
                    >
                      {site.name}
                    </p>
                    <p className="text-sm text-[var(--muted)]">{site.domain}</p>
                  </div>
                  <span className="rounded-md bg-[var(--bg)] px-2 py-1 text-xs text-[var(--muted)]">
                    {site.identityMode === "cookieless"
                      ? "Cookieless"
                      : "Cookie"}
                  </span>
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <p className="text-[var(--muted)]">PV 7d</p>
                    <p className="text-lg font-semibold">{pv}</p>
                  </div>
                  <div>
                    <p className="text-[var(--muted)]">Conv 7d</p>
                    <p className="text-lg font-semibold">{conv}</p>
                  </div>
                </div>
                {write && (
                  <p className="mt-3 font-mono text-[10px] text-[var(--muted)]">
                    {site.publicKey}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <VisitorStream pollMs={10000} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sp-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p
        className="mt-1 text-3xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {value}
      </p>
    </div>
  );
}
