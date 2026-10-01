"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type Meta = {
  scope: string;
  label: string | null;
  requiresPassword: boolean;
  brand: { displayName: string; logoUrl: string | null };
  site: { name: string; domain: string } | null;
};

type Summary =
  | {
      scope: "site";
      brand: { displayName: string; logoUrl: string | null };
      site: { name: string; domain: string };
      summary: {
        range: string;
        pageviews: number;
        conversions: number;
        topPages: { path: string; count: number }[];
        rollups: { date: string; pageviews: number; sessions: number }[];
      };
      privacyNote: string;
    }
  | {
      scope: "org";
      brand: { displayName: string; logoUrl: string | null };
      summary: {
        range: string;
        sites: {
          name: string;
          domain: string;
          pageviews: number;
          conversions: number;
        }[];
        totalPageviews: number;
        totalConversions: number;
      };
      privacyNote: string;
    };

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setError("This share link is invalid, expired, or revoked.");
        return;
      }
      const m = (await res.json()) as Meta;
      setMeta(m);
      if (!m.requiresPassword) {
        await unlock();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function unlock(password?: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/share/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password ? { password } : {}),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not open share");
      return;
    }
    setData(await res.json());
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await unlock(String(fd.get("password") || ""));
  }

  const brand = data?.brand || meta?.brand;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      {brand && (
        <BrandMark
          displayName={brand.displayName}
          logoUrl={brand.logoUrl}
        />
      )}
      {!brand && (
        <p
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Shared report
        </p>
      )}

      {error && !data && (
        <div className="sp-card mt-8 space-y-4 p-6">
          <p className="text-sm text-[var(--danger)]">{error}</p>
          <Link href="/" className="sp-btn sp-btn-ghost !text-sm">
            Home
          </Link>
        </div>
      )}

      {meta?.requiresPassword && !data && (
        <form onSubmit={onSubmit} className="sp-card mt-8 max-w-md space-y-4 p-6">
          <h1 className="text-lg font-semibold">Password required</h1>
          <p className="text-sm text-[var(--muted)]">
            This shared dashboard is password-protected.
          </p>
          <input
            name="password"
            type="password"
            className="sp-input"
            required
            autoFocus
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            className="sp-btn sp-btn-primary"
            disabled={loading}
          >
            {loading ? "Opening…" : "View report"}
          </button>
        </form>
      )}

      {!meta && !error && (
        <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>
      )}

      {data?.scope === "site" && (
        <div className="mt-8 space-y-6">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {data.site.name}
            </h1>
            <p className="text-[var(--muted)]">{data.site.domain} · last 7 days</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Pageviews" value={String(data.summary.pageviews)} />
            <Stat
              label="Conversions"
              value={String(data.summary.conversions)}
            />
          </div>
          <section className="sp-card p-5">
            <h2 className="mb-3 font-semibold">Top pages</h2>
            <ul className="space-y-2 text-sm">
              {data.summary.topPages.map((p) => (
                <li key={p.path} className="flex justify-between gap-3">
                  <span className="truncate font-mono text-xs">{p.path}</span>
                  <span>{p.count}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs text-[var(--muted)]">{data.privacyNote}</p>
        </div>
      )}

      {data?.scope === "org" && (
        <div className="mt-8 space-y-6">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Portfolio summary
            </h1>
            <p className="text-[var(--muted)]">Last 7 days · read-only</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat
              label="Pageviews"
              value={String(data.summary.totalPageviews)}
            />
            <Stat
              label="Conversions"
              value={String(data.summary.totalConversions)}
            />
          </div>
          <ul className="space-y-3">
            {data.summary.sites.map((s) => (
              <li key={s.domain} className="sp-card flex justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-[var(--muted)]">{s.domain}</p>
                </div>
                <p className="text-sm">
                  {s.pageviews} PV · {s.conversions} conv
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--muted)]">{data.privacyNote}</p>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sp-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p
        className="mt-1 text-3xl font-semibold"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {value}
      </p>
    </div>
  );
}
