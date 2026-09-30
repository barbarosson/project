import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <div
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          SitePulse
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="sp-btn sp-btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="sp-btn sp-btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mt-24 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Placeholder brand · M1
        </p>
        <h1
          className="text-5xl leading-[1.05] font-semibold tracking-tight text-[var(--brand-ink)] sm:text-6xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          SitePulse
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
          Privacy-honest pageviews and sessions for agencies. First-party cookie
          or cookieless — choose per site.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="sp-btn sp-btn-primary">
            Create account
          </Link>
          <Link href="/login" className="sp-btn sp-btn-ghost">
            Demo login
          </Link>
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Seeded demo: <code>demo@sitepulse.dev</code> / <code>demo1234</code>
        </p>
      </section>
    </main>
  );
}
