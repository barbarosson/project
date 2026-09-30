import { redirect } from "next/navigation";
import { canManageTeam, getSession, listAccessibleSites } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamPanel } from "@/components/team-panel";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { membership, sites } = await listAccessibleSites(session.id);
  if (!membership) redirect("/dashboard");
  if (!canManageTeam(membership.role)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="mt-2 text-[var(--muted)]">
          Only owners and admins can manage client invites.
        </p>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [invites, members] = await Promise.all([
    prisma.invite.findMany({
      where: { orgId: membership.orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { orgId: membership.orgId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        siteAccess: { select: { siteId: true } },
      },
      orderBy: { role: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Team & clients
        </h1>
        <p className="text-[var(--muted)]">
          Invite clients with read-only access to selected sites.
        </p>
      </div>
      <TeamPanel
        sites={sites.map((s) => ({
          id: s.id,
          name: s.name,
          domain: s.domain,
        }))}
        initialMembers={members.map((m) => ({
          id: m.id,
          role: m.role,
          email: m.user.email,
          name: m.user.name,
          siteIds: m.siteAccess.map((a) => a.siteId),
        }))}
        initialInvites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          siteIds: JSON.parse(i.siteIds || "[]") as string[],
          expiresAt: i.expiresAt.toISOString(),
          acceptedAt: i.acceptedAt?.toISOString() ?? null,
          acceptUrl: i.acceptedAt ? null : `${appUrl}/invite/${i.token}`,
        }))}
      />
    </div>
  );
}
