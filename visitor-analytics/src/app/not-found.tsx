import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        SitePulse
      </Link>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        That URL does not exist or you do not have access.
      </p>
      <div className="sp-row mt-6">
        <Link href="/" className="sp-btn sp-btn-primary">
          Home
        </Link>
        <Link href="/dashboard" className="sp-btn sp-btn-ghost">
          Portfolio
        </Link>
        <Link href="/docs" className="sp-btn sp-btn-ghost">
          Docs
        </Link>
      </div>
    </main>
  );
}
