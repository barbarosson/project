"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = {
  id?: string;
  name: string;
  order: number;
  type: string;
  matchValue: string;
  matchMode: string;
  sessions?: number;
  dropoffRate?: number | null;
  conversionFromStart?: number | null;
};

type Funnel = {
  id: string;
  name: string;
  steps: Step[];
};

export function FunnelsPanel({
  siteId,
  initialFunnels,
}: {
  siteId: string;
  initialFunnels: Funnel[];
}) {
  const router = useRouter();
  const [funnels, setFunnels] = useState(initialFunnels);
  const [stats, setStats] = useState<
    Record<string, { days: number; steps: Step[] }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepCount, setStepCount] = useState(3);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, { days: number; steps: Step[] }> = {};
      await Promise.all(
        funnels.map(async (f) => {
          const res = await fetch(
            `/api/sites/${siteId}/funnels/${f.id}?days=30`
          );
          if (res.ok) {
            const data = await res.json();
            next[f.id] = { days: data.days, steps: data.steps };
          }
        })
      );
      if (!cancelled) setStats(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [funnels, siteId]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      steps.push({
        name: String(fd.get(`stepName${i}`) || `Step ${i + 1}`),
        type: String(fd.get(`stepType${i}`) || "url"),
        matchValue: String(fd.get(`stepMatch${i}`) || ""),
        matchMode: String(fd.get(`stepMode${i}`) || "exact"),
      });
    }
    if (steps.some((s) => !s.matchValue.trim())) {
      setError("Each step needs a path or event name");
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/sites/${siteId}/funnels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), steps }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create funnel");
      return;
    }
    const data = await res.json();
    setFunnels((f) => [...f, data.funnel]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onDelete(funnelId: string) {
    const res = await fetch(`/api/sites/${siteId}/funnels/${funnelId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setFunnels((f) => f.filter((x) => x.id !== funnelId));
      router.refresh();
    }
  }

  return (
    <section className="sp-card space-y-6 p-5">
      <div>
        <h2 className="text-lg font-semibold">Funnels</h2>
        <p className="text-sm text-[var(--muted)]">
          Ordered steps (2–5). Drop-off is session-based: each step must occur
          after the previous in the same session (30-day window).
        </p>
      </div>

      {funnels.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No funnels yet.</p>
      ) : (
        funnels.map((f) => {
          const st = stats[f.id]?.steps;
          const max = Math.max(1, ...(st?.map((s) => s.sessions || 0) || [1]));
          return (
            <div
              key={f.id}
              className="rounded-lg border border-[var(--line)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold">{f.name}</h3>
                <button
                  type="button"
                  className="text-xs text-[var(--danger)]"
                  onClick={() => onDelete(f.id)}
                >
                  Delete
                </button>
              </div>
              {!st ? (
                <p className="text-sm text-[var(--muted)]">Loading stats…</p>
              ) : (
                <ol className="space-y-3">
                  {st.map((step, i) => (
                    <li key={step.id || i}>
                      <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                        <span>
                          <span className="font-medium">
                            {i + 1}. {step.name}
                          </span>{" "}
                          <span className="text-[var(--muted)]">
                            ({step.type}:{" "}
                            <code className="text-xs">{step.matchValue}</code>)
                          </span>
                        </span>
                        <span className="text-[var(--muted)]">
                          {step.sessions} sessions
                          {step.dropoffRate != null
                            ? ` · −${Math.round(step.dropoffRate * 100)}% drop`
                            : ""}
                          {step.conversionFromStart != null
                            ? ` · ${Math.round(step.conversionFromStart * 100)}% of start`
                            : ""}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-[var(--bg)]">
                        <div
                          className="h-full rounded bg-[var(--brand)]"
                          style={{
                            width: `${((step.sessions || 0) / max) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })
      )}

      <form onSubmit={onCreate} className="space-y-3 border-t border-[var(--line)] pt-4">
        <h3 className="font-semibold">Create funnel</h3>
        <div>
          <label className="sp-label" htmlFor="funnel-name">
            Name
          </label>
          <input id="funnel-name" name="name" required className="sp-input" />
        </div>
        <div>
          <label className="sp-label" htmlFor="step-count">
            Steps
          </label>
          <select
            id="step-count"
            className="sp-input max-w-[8rem]"
            value={stepCount}
            onChange={(e) => setStepCount(Number(e.target.value))}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        {Array.from({ length: stepCount }).map((_, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-lg bg-[var(--bg)] p-3 sm:grid-cols-4"
          >
            <div className="sm:col-span-1">
              <label className="sp-label">Step {i + 1} name</label>
              <input
                name={`stepName${i}`}
                defaultValue={`Step ${i + 1}`}
                className="sp-input"
                required
              />
            </div>
            <div>
              <label className="sp-label">Type</label>
              <select
                name={`stepType${i}`}
                className="sp-input"
                defaultValue="url"
              >
                <option value="url">URL</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="sp-label">Match</label>
              <select
                name={`stepMode${i}`}
                className="sp-input"
                defaultValue="exact"
              >
                <option value="exact">Exact</option>
                <option value="prefix">Prefix</option>
              </select>
            </div>
            <div>
              <label className="sp-label">Path / event</label>
              <input
                name={`stepMatch${i}`}
                className="sp-input"
                required
                placeholder={i === 0 ? "/" : i === stepCount - 1 ? "/thanks" : "/pricing"}
              />
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          className="sp-btn sp-btn-primary"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create funnel"}
        </button>
      </form>
    </section>
  );
}
