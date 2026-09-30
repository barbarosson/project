import Link from "next/link";

export type Crumb = {
  href?: string;
  label: string;
};

/** Compact breadcrumb trail — Home first, current page last (no link). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]"
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-[var(--ink)]">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-[var(--ink)]" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** Single back / home link used under page titles. */
export function BackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}

/** Auth / invite chrome: brand + Home + secondary links. */
export function AuthChrome({
  children,
  links,
}: {
  children: React.ReactNode;
  links?: { href: string; label: string }[];
}) {
  const extras = links ?? [
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ];
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          SitePulse
        </Link>
        <nav className="sp-nav text-sm font-medium">
          <BackLink href="/" label="Home" />
          {extras.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </main>
  );
}
