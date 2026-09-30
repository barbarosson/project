import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <MarketingHeader />

      <section className="relative mt-16 overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[#e8f5ef] via-white to-[#f7ebe1] px-6 py-16 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #0f6b4c22 0%, transparent 45%), radial-gradient(circle at 80% 0%, #c45c2622 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Privacy-honest · Agency multi-site
          </p>
          <h1
            className="text-5xl leading-[1.05] font-semibold tracking-tight text-[var(--brand-ink)] sm:text-6xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            SitePulse
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            Track conversions across every client site — without GA4 complexity
            or privacy theater. Cookie or cookieless, per site.
          </p>
          <div className="sp-row mt-8">
            <Link href="/register" className="sp-btn sp-btn-primary">
              Start free
            </Link>
            <Link href="/pricing" className="sp-btn sp-btn-ghost">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-8 sm:grid-cols-3">
        {[
          {
            title: "Honest compliance",
            body: "We process truncated IP, UA, and identifiers. Cookie mode needs disclosure. Cookieless is not a GDPR free pass.",
          },
          {
            title: "Agency portfolio",
            body: "Multi-site orgs, client read-only invites, visitor stream, and conversion funnels in one English UI.",
          },
          {
            title: "Subscription-first",
            body: "Starter / Agency / Scale via Merchant of Record. No AppSumo LTD in the first 12 months.",
          },
        ].map((f) => (
          <div key={f.title}>
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {f.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 sp-card p-8">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          From snippet to conversions
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[var(--muted)]">
          <li>Create an org and add a site — get a public site key.</li>
          <li>Install one script; choose cookie or cookieless; optional consent gate.</li>
          <li>Define URL or event goals and a 2–5 step funnel.</li>
          <li>Invite clients read-only. Watch the stream. Upgrade via Lemon Squeezy when ready.</li>
        </ol>
        <div className="sp-row mt-6">
          <Link href="/docs" className="sp-btn sp-btn-ghost">
            Read docs
          </Link>
          <Link href="/register" className="sp-btn sp-btn-primary">
            Create account
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
