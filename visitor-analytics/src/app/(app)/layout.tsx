import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              SitePulse
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-[var(--muted)]">
              <Link href="/dashboard" className="hover:text-[var(--ink)]">
                Dashboard
              </Link>
              <Link href="/sites/new" className="hover:text-[var(--ink)]">
                Add site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--muted)]">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
