import Link from "next/link";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

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
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <MarketingHeader />
      <div className="mt-12 grid gap-10 lg:grid-cols-[200px_1fr]">
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
        </aside>
        <article className="prose-sp max-w-none">
          <h1
            className="text-3xl font-semibold tracking-tight text-[var(--brand-ink)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {title}
          </h1>
          <div className="mt-6 space-y-4 text-[var(--muted)]">{children}</div>
        </article>
      </div>
      <MarketingFooter />
    </main>
  );
}
