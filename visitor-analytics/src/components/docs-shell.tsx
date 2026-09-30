import Link from "next/link";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";
import { Breadcrumbs } from "@/components/page-nav";

const NAV = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/install", label: "Install snippet" },
  { href: "/docs/events", label: "Events API" },
  { href: "/docs/conversions", label: "Conversions & funnels" },
  { href: "/docs/dpa", label: "DPA outline" },
];

export function DocsShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const isOverview = title === "Documentation";
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <MarketingHeader />
      <div className="mt-8">
        <Breadcrumbs
          items={
            isOverview
              ? [
                  { href: "/", label: "Home" },
                  { label: "Docs" },
                ]
              : [
                  { href: "/", label: "Home" },
                  { href: "/docs", label: "Docs" },
                  { label: title },
                ]
          }
        />
      </div>
      <div className="mt-6 grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-2 text-sm">
          <p className="font-semibold text-[var(--ink)]">Docs</p>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block text-[var(--muted)] hover:text-[var(--brand)]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-4 block text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ← Home
          </Link>
        </aside>
        <article className="prose-sp max-w-none">
          <h1
            className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {title}
          </h1>
          <div className="mt-6 space-y-4 text-[var(--muted)]">{children}</div>
          <div className="sp-row mt-10 border-t border-[var(--line)] pt-6">
            {!isOverview && (
              <Link href="/docs" className="sp-btn sp-btn-ghost !text-sm">
                ← All docs
              </Link>
            )}
            <Link href="/register" className="sp-btn sp-btn-primary !text-sm">
              Create account
            </Link>
            <Link href="/pricing" className="sp-btn sp-btn-ghost !text-sm">
              Pricing
            </Link>
          </div>
        </article>
      </div>
      <MarketingFooter />
    </main>
  );
}
