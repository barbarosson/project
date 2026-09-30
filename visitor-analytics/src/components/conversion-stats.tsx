type TrendPoint = { date: string; count: number };
type ByGoal = { goalId: string; name: string; type: string; count: number };
type UtmRow = { source: string; count: number };
type Recent = {
  id: string;
  goalName: string;
  goalType: string;
  path: string | null;
  eventName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date | string;
};

export function ConversionStats({
  total7,
  total30,
  trend7,
  trend30,
  byGoal30,
  utmBreakdown,
  recent,
}: {
  total7: number;
  total30: number;
  trend7: TrendPoint[];
  trend30: TrendPoint[];
  byGoal30: ByGoal[];
  utmBreakdown: UtmRow[];
  recent: Recent[];
}) {
  const max7 = Math.max(1, ...trend7.map((t) => t.count));
  const max30 = Math.max(1, ...trend30.map((t) => t.count));

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sp-card p-5">
          <p className="text-sm text-[var(--muted)]">Conversions (7d)</p>
          <p
            className="mt-1 text-3xl font-semibold"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {total7}
          </p>
          <MiniBars points={trend7} max={max7} />
        </div>
        <div className="sp-card p-5">
          <p className="text-sm text-[var(--muted)]">Conversions (30d)</p>
          <p
            className="mt-1 text-3xl font-semibold"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {total30}
          </p>
          <MiniBars points={trend30} max={max30} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="sp-card p-5">
          <h3 className="mb-3 font-semibold">By goal (30d)</h3>
          {byGoal30.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No goals / conversions.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {byGoal30.map((g) => (
                <li
                  key={g.goalId}
                  className="flex justify-between border-b border-[var(--line)] pb-2"
                >
                  <span>
                    {g.name}{" "}
                    <span className="text-[var(--muted)]">
                      ({g.type === "url" ? "URL" : "Event"})
                    </span>
                  </span>
                  <span className="font-semibold">{g.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="sp-card p-5">
          <h3 className="mb-3 font-semibold">UTM on conversions (30d)</h3>
          {utmBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No conversion UTMs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {utmBreakdown.map((u) => (
                <li
                  key={u.source}
                  className="flex justify-between gap-3 border-b border-[var(--line)] pb-2"
                >
                  <span className="truncate font-mono text-xs">{u.source}</span>
                  <span className="font-semibold">{u.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="sp-card p-5">
        <h3 className="mb-3 font-semibold">Recent conversions</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">None yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((c) => (
              <li
                key={c.id}
                className="border-b border-[var(--line)] pb-2 last:border-0"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold">{c.goalName}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {String(c.createdAt).replace("T", " ").slice(0, 19)}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {c.goalType === "event"
                    ? `event: ${c.eventName}`
                    : `path: ${c.path}`}
                  {c.utmSource ? ` · utm: ${c.utmSource}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MiniBars({ points, max }: { points: TrendPoint[]; max: number }) {
  return (
    <div className="mt-4 flex h-16 items-end gap-0.5">
      {points.map((p) => (
        <div
          key={p.date}
          className="flex-1 rounded-t bg-[var(--accent)] opacity-80"
          style={{ height: `${Math.max(4, (p.count / max) * 100)}%` }}
          title={`${p.date}: ${p.count}`}
        />
      ))}
    </div>
  );
}
