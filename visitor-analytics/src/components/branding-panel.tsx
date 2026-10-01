"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function BrandingPanel({
  initial,
}: {
  initial: {
    brandLogoUrl: string | null;
    brandDisplayName: string | null;
    digestEnabled: boolean;
    spikeMultiplier: number;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const logo = String(fd.get("brandLogoUrl") || "").trim();
    const name = String(fd.get("brandDisplayName") || "").trim();
    const res = await fetch("/api/org/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandLogoUrl: logo || null,
        brandDisplayName: name || null,
        digestEnabled: fd.get("digestEnabled") === "on",
        spikeMultiplier: Number(fd.get("spikeMultiplier") || 3),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Save failed");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <section className="sp-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">White-label client portal</h2>
        <p className="text-sm text-[var(--muted)]">
          Logo URL + display name appear on client invite views and shared
          dashboard links. Host the image yourself (HTTPS recommended).
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="sp-label" htmlFor="brandDisplayName">
            Display name
          </label>
          <input
            id="brandDisplayName"
            name="brandDisplayName"
            className="sp-input"
            defaultValue={initial.brandDisplayName ?? ""}
            placeholder="Acme Analytics"
          />
        </div>
        <div>
          <label className="sp-label" htmlFor="brandLogoUrl">
            Logo URL
          </label>
          <input
            id="brandLogoUrl"
            name="brandLogoUrl"
            className="sp-input"
            defaultValue={initial.brandLogoUrl ?? ""}
            placeholder="https://cdn.example.com/logo.svg"
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="digestEnabled"
              defaultChecked={initial.digestEnabled}
            />
            Weekly digest enabled
          </label>
          <div>
            <label className="sp-label" htmlFor="spikeMultiplier">
              Spike multiplier (avg × N)
            </label>
            <input
              id="spikeMultiplier"
              name="spikeMultiplier"
              type="number"
              step="0.5"
              min={1.5}
              max={20}
              className="sp-input w-28"
              defaultValue={initial.spikeMultiplier}
            />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {saved && (
          <p className="text-sm text-[var(--brand)]">Branding saved.</p>
        )}
        <button
          type="submit"
          className="sp-btn sp-btn-primary"
          disabled={loading}
        >
          {loading ? "Saving…" : "Save branding & alerts"}
        </button>
      </form>
    </section>
  );
}
