import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <MarketingHeader />
      <article className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Stub for counsel review · English
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {title}
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
          {children}
        </div>
      </article>
      <MarketingFooter />
    </main>
  );
}
