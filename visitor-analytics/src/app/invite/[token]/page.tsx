"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { AuthChrome, BackLink } from "@/components/page-nav";

type InviteInfo = {
  email: string;
  orgName: string;
  brand?: { displayName: string; logoUrl: string | null };
  sites: { id: string; name: string; domain: string }[];
  expiresAt: string;
};

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/invites/accept?token=${encodeURIComponent(token)}`
      );
      if (!res.ok) {
        setError("Invite invalid or expired");
        return;
      }
      setInfo(await res.json());
    })();
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: fd.get("password"),
        name: fd.get("name"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not accept invite");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const brandName = info?.brand?.displayName || info?.orgName || "Agency";

  return (
    <AuthChrome links={[{ href: "/login", label: "Log in" }]}>
      {info?.brand && (
        <div className="mb-4">
          <BrandMark
            displayName={info.brand.displayName}
            logoUrl={info.brand.logoUrl}
            size="sm"
          />
        </div>
      )}
      <h1 className="text-2xl font-semibold">Accept client invite</h1>
      {!info && !error && (
        <p className="mt-2 text-sm text-[var(--muted)]">Loading invite…</p>
      )}
      {error && !info && (
        <div className="sp-card mt-6 space-y-4 p-6">
          <p className="text-sm text-[var(--danger)]">{error}</p>
          <p className="text-sm text-[var(--muted)]">
            Ask your agency for a new invite link, or go back home.
          </p>
          <div className="sp-row">
            <Link href="/" className="sp-btn sp-btn-primary">
              Home
            </Link>
            <Link href="/login" className="sp-btn sp-btn-ghost">
              Log in
            </Link>
          </div>
        </div>
      )}
      {info && (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Join <strong>{brandName}</strong> as a read-only client (
            {info.email}). Sites:{" "}
            {info.sites.map((s) => s.name).join(", ") || "none"}.
          </p>
          <form onSubmit={onSubmit} className="sp-card mt-6 space-y-4 p-6">
            <div>
              <label className="sp-label" htmlFor="name">
                Your name
              </label>
              <input id="name" name="name" className="sp-input" required />
            </div>
            <div>
              <label className="sp-label" htmlFor="password">
                Choose a password (min 8)
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
              {loading ? "Joining…" : "Accept & continue"}
            </button>
          </form>
          <div className="mt-4">
            <BackLink href="/" label="Home" />
          </div>
        </>
      )}
    </AuthChrome>
  );
}
