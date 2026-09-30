import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        SitePulse
      </Link>
      <nav className="sp-nav text-sm font-medium">
        <Link href="/pricing" className="text-[var(--muted)] hover:text-[var(--ink)]">
          Pricing
        </Link>
        <Link href="/docs" className="text-[var(--muted)] hover:text-[var(--ink)]">
          Docs
        </Link>
        <Link
          href="/privacy"
          className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline"
        >
          Privacy
        </Link>
        <Link href="/login" className="sp-btn sp-btn-ghost !py-1.5 !text-sm">
          Log in
        </Link>
        <Link href="/register" className="sp-btn sp-btn-primary !py-1.5 !text-sm">
          Get started
        </Link>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
      <div className="sp-nav">
        <Link href="/privacy" className="hover:text-[var(--ink)]">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-[var(--ink)]">
          Terms
        </Link>
        <Link href="/dpa" className="hover:text-[var(--ink)]">
          DPA
        </Link>
        <Link href="/docs" className="hover:text-[var(--ink)]">
          Docs
        </Link>
        <Link href="/pricing" className="hover:text-[var(--ink)]">
          Pricing
        </Link>
      </div>
      <p className="mt-4">
        SitePulse is a placeholder brand. We process analytics data honestly —
        truncated IP, user-agent, and identifiers can be personal data. Default
        retention 90 days. No AppSumo LTD.
      </p>
    </footer>
  );
}
