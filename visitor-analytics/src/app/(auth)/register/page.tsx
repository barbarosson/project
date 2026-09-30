"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthChrome } from "@/components/page-nav";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = useMemo(() => searchParams.get("plan"), [searchParams]);
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
    router.push(plan ? `/billing?plan=${encodeURIComponent(plan)}` : "/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Email + password auth (free-tier friendly, no third-party auth vendor).
      </p>
      {plan && (
        <p className="mt-2 rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--muted)]">
          Selected plan: <strong className="text-[var(--ink)]">{plan}</strong>.
          After signup you can upgrade from Billing.
        </p>
      )}
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
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthChrome>
      <Suspense
        fallback={
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthChrome>
  );
}
