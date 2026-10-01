import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canManageTeam,
  canWrite,
  getSession,
  getUserOrg,
} from "@/lib/auth";
import { brandDisplayName, brandLogoUrl } from "@/lib/branding";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getUserOrg(session.id);
  const write = membership ? canWrite(membership.role) : false;
  const manage = membership ? canManageTeam(membership.role) : false;
  const isClient = membership?.role === "client";
  const displayName = membership
    ? brandDisplayName(membership.org)
    : "SitePulse";
  const logoUrl = membership ? brandLogoUrl(membership.org) : null;

  const unread =
    membership && !isClient
      ? await prisma.notification.count({
          where: { orgId: membership.orgId, readAt: null },
        })
      : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="block">
              {isClient ? (
                <BrandMark
                  displayName={displayName}
                  logoUrl={logoUrl}
                  size="sm"
                />
              ) : (
                <span
                  className="text-xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  SitePulse
                </span>
              )}
            </Link>
            <nav className="sp-nav text-sm font-medium text-[var(--muted)]">
              <Link href="/dashboard" className="hover:text-[var(--ink)]">
                Portfolio
              </Link>
              <Link href="/stream" className="hover:text-[var(--ink)]">
                Stream
              </Link>
              {write && (
                <Link href="/sites/new" className="hover:text-[var(--ink)]">
                  Add site
                </Link>
              )}
              {manage && (
                <Link href="/team" className="hover:text-[var(--ink)]">
                  Team
                </Link>
              )}
              {!isClient && (
                <Link
                  href="/notifications"
                  className="hover:text-[var(--ink)]"
                >
                  Alerts
                  {unread > 0 ? ` (${unread})` : ""}
                </Link>
              )}
              <Link href="/billing" className="hover:text-[var(--ink)]">
                Billing
              </Link>
              <Link href="/docs" className="hover:text-[var(--ink)]">
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--muted)]">
              {session.email}
              {isClient ? " · client" : ""}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
