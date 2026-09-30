import Link from "next/link";
import { getSession, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getUserOrg(session.id);
  if (!membership) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">No organization</h1>
        <p className="mt-2 text-[var(--muted)]">
          Something went wrong with your account setup.
        </p>
      </div>
    );
  }

  const sites = await prisma.site.findMany({
    where: { orgId: membership.orgId },
    orderBy: { createdAt: "asc" },
  });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const siteIds = sites.map((s) => s.id);

  const [pv7d, recent] = await Promise.all([
    siteIds.length
      ? prisma.event.count({
          where: { siteId: { in: siteIds }, createdAt: { gte: since } },
        })
      : Promise.resolve(0),
    siteIds.length
      ? prisma.event.findMany({
          where: { siteId: { in: siteIds } },
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { site: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {membership.org.name}
          </p>
          <h1
            className="mt-1 text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Dashboard
          </h1>
        </div>
        <Link href="/sites/new" className="sp-btn sp-btn-primary">
          Add site
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites" value={String(sites.length)} />
        <Stat label="Pageviews (7d)" value={String(pv7d)} />
        <Stat
          label="Identity modes"
          value={
            sites.some((s) => s.identityMode === "cookieless") &&
            sites.some((s) => s.identityMode === "first_party_cookie")
              ? "Both"
              : sites[0]?.identityMode === "cookieless"
                ? "Cookieless"
                : "Cookie"
          }
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Sites</h2>
        {sites.length === 0 ? (
          <p className="text-[var(--muted)]">
            No sites yet.{" "}
            <Link href="/sites/new" className="text-[var(--brand)] underline">
              Create your first site
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Identity</th>
                  <th className="px-4 py-3 font-medium">Site key</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sites/${site.id}`}
                        className="font-semibold text-[var(--brand)] hover:underline"
                      >
                        {site.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {site.domain}
                    </td>
                    <td className="px-4 py-3">
                      {site.identityMode === "cookieless"
                        ? "Cookieless"
                        : "First-party cookie"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {site.publicKey}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent pageviews</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {recent.length === 0 ? (
            <p className="p-4 text-sm text-[var(--muted)]">
              No events yet. Install the snippet to start receiving pageviews.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {ev.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-4 py-3">{ev.site.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ev.path}</td>
                    <td className="px-4 py-3">{ev.deviceClass ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
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
