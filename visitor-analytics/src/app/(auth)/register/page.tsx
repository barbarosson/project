"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        name: fd.get("name"),
        orgName: fd.get("orgName"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        SitePulse
      </Link>
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Email + password auth (free-tier friendly, no third-party auth vendor).
      </p>
      <form onSubmit={onSubmit} className="sp-card mt-6 space-y-4 p-6">
        <div>
          <label className="sp-label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" className="sp-input" required />
        </div>
        <div>
          <label className="sp-label" htmlFor="orgName">
            Organization
          </label>
          <input id="orgName" name="orgName" className="sp-input" required />
        </div>
        <div>
          <label className="sp-label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className="sp-input" required />
        </div>
        <div>
          <label className="sp-label" htmlFor="password">
            Password (min 8)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            className="sp-input"
            required
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          className="sp-btn sp-btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--brand)]">
          Log in
        </Link>
      </p>
    </main>
  );
}
