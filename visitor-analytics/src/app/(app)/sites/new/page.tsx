"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        domain: fd.get("domain"),
        identityMode: fd.get("identityMode"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create site");
      return;
    }
    const data = await res.json();
    router.push(`/sites/${data.site.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <span aria-hidden="true">←</span>
        Portfolio
      </Link>
      <h1
        className="mt-3 text-3xl font-semibold"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Add site
      </h1>
      <form onSubmit={onSubmit} className="sp-card mt-6 space-y-4 p-6">
        <div>
          <label className="sp-label" htmlFor="name">
            Site name
          </label>
          <input id="name" name="name" required className="sp-input" />
        </div>
        <div>
          <label className="sp-label" htmlFor="domain">
            Domain
          </label>
          <input
            id="domain"
            name="domain"
            required
            placeholder="example.com"
            className="sp-input"
          />
        </div>
        <div>
          <label className="sp-label" htmlFor="identityMode">
            Identity mode
          </label>
          <select
            id="identityMode"
            name="identityMode"
            className="sp-input"
            defaultValue="first_party_cookie"
          >
            <option value="first_party_cookie">First-party cookie</option>
            <option value="cookieless">Cookieless</option>
          </select>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Cookie mode stores visitor/session IDs in first-party cookies.
            Cookieless derives a daily visitor hash server-side (no persistent
            client ID).
          </p>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          className="sp-btn sp-btn-primary"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create site"}
        </button>
      </form>
    </div>
  );
}
