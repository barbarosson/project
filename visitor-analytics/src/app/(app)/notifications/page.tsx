import { redirect } from "next/navigation";
import { getSession, getUserOrg } from "@/lib/auth";
import { listOrgNotifications } from "@/lib/notifications";
import { NotificationsPanel } from "@/components/notifications-panel";
import { BackLink } from "@/components/page-nav";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const membership = await getUserOrg(session.id);
  if (!membership) redirect("/dashboard");
  if (membership.role === "client") {
    return (
      <div className="space-y-4">
        <BackLink href="/dashboard" label="Portfolio" />
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-[var(--muted)]">
          Digest and alert notifications are for agency staff only.
        </p>
      </div>
    );
  }

  const notifications = await listOrgNotifications(membership.orgId);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/dashboard" label="Portfolio" />
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Notifications
        </h1>
      </div>
      <NotificationsPanel
        initial={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
