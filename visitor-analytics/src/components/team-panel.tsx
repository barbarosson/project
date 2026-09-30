"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SiteOpt = { id: string; name: string; domain: string };
type Member = {
  id: string;
  role: string;
  email: string;
  name: string | null;
  siteIds: string[];
};
type Invite = {
  id: string;
  email: string;
  siteIds: string[];
  expiresAt: string;
  acceptedAt: string | null;
  acceptUrl: string | null;
};

export function TeamPanel({
  sites,
  initialMembers,
  initialInvites,
}: {
  sites: SiteOpt[];
  initialMembers: Member[];
  initialInvites: Invite[];
}) {
  const router = useRouter();
  const [members] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [error, setError] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    sites.slice(0, 1).map((s) => s.id)
  );

  function toggleSite(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastLink(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/org/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        siteIds: selected,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invite failed");
      return;
    }
    const data = await res.json();
    setLastLink(data.invite.acceptUrl);
    setInvites((list) => [
      {
        id: data.invite.id,
        email: data.invite.email,
        siteIds: data.invite.siteIds,
        expiresAt: data.invite.expiresAt,
        acceptedAt: null,
        acceptUrl: data.invite.acceptUrl,
      },
      ...list,
    ]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onRevoke(id: string) {
    const res = await fetch(`/api/org/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((list) => list.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="sp-card p-5">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap justify-between gap-2 border-b border-[var(--line)] pb-2"
            >
              <span>
                <span className="font-semibold">{m.email}</span>
                {m.name ? (
                  <span className="text-[var(--muted)]"> · {m.name}</span>
                ) : null}
              </span>
              <span className="text-[var(--muted)]">
                {m.role}
                {m.role === "client" && m.siteIds.length
                  ? ` · ${m.siteIds.length} site(s)`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-card p-5">
        <h2 className="text-lg font-semibold">Invite client (read-only)</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Clients can view selected sites only. No email provider in M3 — copy
          the accept link and share it manually.
        </p>
        <form onSubmit={onInvite} className="space-y-4">
          <div>
            <label className="sp-label" htmlFor="invite-email">
              Client email
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              className="sp-input"
            />
          </div>
          <div>
            <p className="sp-label">Sites they can view</p>
            <div className="space-y-2">
              {sites.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                  />
                  {s.name}{" "}
                  <span className="text-[var(--muted)]">({s.domain})</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {lastLink && (
            <div className="rounded-lg bg-[var(--bg)] p-3 text-sm">
              <p className="font-semibold text-[var(--ok)]">Invite created</p>
              <p className="mt-1 break-all font-mono text-xs">{lastLink}</p>
            </div>
          )}
          <button
            type="submit"
            className="sp-btn sp-btn-primary"
            disabled={loading || selected.length === 0}
          >
            {loading ? "Creating…" : "Create invite link"}
          </button>
        </form>
      </section>

      <section className="sp-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Pending / recent invites</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No invites yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {invites.map((i) => (
              <li
                key={i.id}
                className="border-b border-[var(--line)] pb-3 last:border-0"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{i.email}</span>
                  <span className="text-[var(--muted)]">
                    {i.acceptedAt ? "Accepted" : "Pending"}
                  </span>
                </div>
                {i.acceptUrl && (
                  <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                    {i.acceptUrl}
                  </p>
                )}
                {!i.acceptedAt && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-[var(--danger)]"
                    onClick={() => onRevoke(i.id)}
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
