"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Goal = {
  id: string;
  name: string;
  type: string;
  matchValue: string;
  matchMode: string;
};

export function GoalsPanel({
  siteId,
  initialGoals,
}: {
  siteId: string;
  initialGoals: Goal[];
}) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/sites/${siteId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        type: fd.get("type"),
        matchValue: fd.get("matchValue"),
        matchMode: fd.get("matchMode") || "exact",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create goal");
      return;
    }
    const data = await res.json();
    setGoals((g) => [...g, data.goal]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function onDelete(goalId: string) {
    const res = await fetch(`/api/sites/${siteId}/goals/${goalId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setGoals((g) => g.filter((x) => x.id !== goalId));
      router.refresh();
    }
  }

  return (
    <section className="sp-card p-5">
      <h2 className="text-lg font-semibold">Conversion goals</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        URL goals fire on matching pageviews. Event goals fire when the snippet
        calls <code>sitepulse.track(&apos;event_name&apos;)</code>. One conversion
        counted per session per goal.
      </p>

      {goals.length === 0 ? (
        <p className="mb-4 text-sm text-[var(--muted)]">No goals yet.</p>
      ) : (
        <ul className="mb-4 space-y-2 text-sm">
          {goals.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2"
            >
              <div>
                <span className="font-semibold">{g.name}</span>
                <span className="ml-2 text-[var(--muted)]">
                  {g.type === "url" ? "URL" : "Event"} ·{" "}
                  <code className="text-xs">{g.matchValue}</code>
                  {g.type === "url" ? ` (${g.matchMode})` : ""}
                </span>
              </div>
              <button
                type="button"
                className="text-xs text-[var(--danger)]"
                onClick={() => onDelete(g.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="sp-label" htmlFor="goal-name">
            Goal name
          </label>
          <input id="goal-name" name="name" required className="sp-input" />
        </div>
        <div>
          <label className="sp-label" htmlFor="goal-type">
            Type
          </label>
          <select id="goal-type" name="type" className="sp-input" defaultValue="url">
            <option value="url">URL path</option>
            <option value="event">Custom event</option>
          </select>
        </div>
        <div>
          <label className="sp-label" htmlFor="goal-mode">
            URL match
          </label>
          <select
            id="goal-mode"
            name="matchMode"
            className="sp-input"
            defaultValue="exact"
          >
            <option value="exact">Exact</option>
            <option value="prefix">Prefix</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="sp-label" htmlFor="goal-match">
            Path or event name
          </label>
          <input
            id="goal-match"
            name="matchValue"
            required
            placeholder="/thanks or signup_complete"
            className="sp-input"
          />
        </div>
        {error && (
          <p className="sm:col-span-2 text-sm text-[var(--danger)]">{error}</p>
        )}
        <button
          type="submit"
          className="sp-btn sp-btn-primary w-fit"
          disabled={loading}
        >
          {loading ? "Adding…" : "Add goal"}
        </button>
      </form>
    </section>
  );
}
