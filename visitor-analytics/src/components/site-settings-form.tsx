"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  siteId: string;
  initial: {
    name: string;
    domain: string;
    identityMode: string;
    ipTruncate: boolean;
    retentionDays: number;
    publicKey: string;
  };
};

export function SiteSettingsForm({ siteId, initial }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        domain: fd.get("domain"),
        identityMode: fd.get("identityMode"),
        ipTruncate: fd.get("ipTruncate") === "on",
        retentionDays: Number(fd.get("retentionDays")),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Update failed");
      return;
    }
    setMsg("Saved");
    router.refresh();
  }

  return (
    <section className="sp-card p-5">
      <h2 className="text-lg font-semibold">Site settings</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Privacy defaults: IP truncation on, retention {initial.retentionDays}{" "}
        days (purge cron deferred).
      </p>
      <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
        <div>
          <label className="sp-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initial.name}
            className="sp-input"
            required
          />
        </div>
        <div>
          <label className="sp-label" htmlFor="domain">
            Domain
          </label>
          <input
            id="domain"
            name="domain"
            defaultValue={initial.domain}
            className="sp-input"
            required
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
            defaultValue={initial.identityMode}
          >
            <option value="first_party_cookie">First-party cookie</option>
            <option value="cookieless">Cookieless</option>
          </select>
        </div>
        <div>
          <label className="sp-label" htmlFor="retentionDays">
            Retention (days)
          </label>
          <input
            id="retentionDays"
            name="retentionDays"
            type="number"
            min={1}
            max={730}
            defaultValue={initial.retentionDays}
            className="sp-input"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ipTruncate"
            defaultChecked={initial.ipTruncate}
          />
          Truncate IP addresses before storage
        </label>
        <div>
          <p className="sp-label">Public site key</p>
          <code className="block rounded-lg bg-[var(--bg)] px-3 py-2 font-mono text-xs">
            {initial.publicKey}
          </code>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {msg && <p className="text-sm text-[var(--ok)]">{msg}</p>}
        <button
          type="submit"
          className="sp-btn sp-btn-primary w-fit"
          disabled={loading}
        >
          {loading ? "Saving…" : "Save settings"}
        </button>
      </form>
    </section>
  );
}
