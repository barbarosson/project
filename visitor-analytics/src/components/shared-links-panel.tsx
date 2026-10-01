"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LinkRow = {
  id: string;
  scope: string;
  label: string | null;
  siteId: string | null;
  site: { id: string; name: string; domain: string } | null;
  hasPassword: boolean;
  expiresAt: string | null;
  createdAt: string;
  url: string;
};

export function SharedLinksPanel({
  scope,
  siteId,
  initialLinks,
}: {
  scope: "site" | "org";
  siteId?: string;
  initialLinks: LinkRow[];
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastUrl(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "").trim();
    const expiresRaw = String(fd.get("expiresInDays") || "").trim();
    const res = await fetch("/api/org/shared-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        siteId: scope === "site" ? siteId : undefined,
        label: fd.get("label") || undefined,
        password: password || null,
        expiresInDays: expiresRaw ? Number(expiresRaw) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create link");
      return;
    }
    const data = await res.json();
    setLastUrl(data.link.url);
    setLinks((list) => [data.link, ...list]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onRevoke(id: string) {
    const res = await fetch(`/api/org/shared-links/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLinks((list) => list.filter((l) => l.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="sp-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">Shared dashboard link</h2>
        <p className="text-sm text-[var(--muted)]">
          Read-only URL for clients or demos — no account required. Optional
          password. Revoke anytime. Token stored in the database.
        </p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="sp-label" htmlFor={`share-label-${scope}`}>
            Label (optional)
          </label>
          <input
            id={`share-label-${scope}`}
            name="label"
            className="sp-input"
            placeholder={
              scope === "org" ? "Q4 portfolio summary" : "Client weekly report"
            }
          />
        </div>
        <div>
          <label className="sp-label" htmlFor={`share-pw-${scope}`}>
            Password (optional)
          </label>
          <input
            id={`share-pw-${scope}`}
            name="password"
            type="password"
            className="sp-input"
            autoComplete="new-password"
            placeholder="Leave blank for open link"
          />
        </div>
        <div>
          <label className="sp-label" htmlFor={`share-exp-${scope}`}>
            Expires in days (optional)
          </label>
          <input
            id={`share-exp-${scope}`}
            name="expiresInDays"
            type="number"
            min={1}
            max={365}
            className="sp-input"
            placeholder="e.g. 30"
          />
        </div>
        {error && (
          <p className="sm:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="sp-btn sp-btn-primary"
            disabled={loading}
          >
            {loading ? "Creating…" : "Create share link"}
          </button>
        </div>
      </form>

      {lastUrl && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--wash)] p-3 text-sm">
          <p className="font-medium">Share this URL</p>
          <code className="mt-1 block break-all text-xs">{lastUrl}</code>
        </div>
      )}

      <ul className="space-y-2 text-sm">
        {links.length === 0 && (
          <li className="text-[var(--muted)]">No active share links.</li>
        )}
        {links.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-2 last:border-0"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {l.label || (l.scope === "org" ? "Portfolio share" : "Site share")}
                {l.hasPassword ? " · password" : " · open"}
              </p>
              <code className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                {l.url}
              </code>
              {l.expiresAt && (
                <p className="text-xs text-[var(--muted)]">
                  Expires {new Date(l.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              type="button"
              className="sp-btn sp-btn-ghost !text-xs"
              onClick={() => onRevoke(l.id)}
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
