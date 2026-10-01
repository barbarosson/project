export type JourneyPanelRow = {
  key: string;
  visitorId: string;
  sessionId: string;
  firstTouch: {
    source: string;
    referrer: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    at: string;
  };
  pages: { path: string; at: string; type: string }[];
  conversion: {
    goalName: string;
    at: string;
    path: string | null;
    eventName: string | null;
  } | null;
  identityNote: string;
};

export function JourneyPanel({
  rows,
  identityMode,
}: {
  rows: JourneyPanelRow[];
  identityMode: string;
}) {
  const note =
    rows[0]?.identityNote ||
    (identityMode === "cookieless"
      ? "Cookieless: best-effort same-day hashes only."
      : "First-party cookie identity within this site.");

  return (
    <section className="sp-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">First-touch / journey</h2>
        <p className="text-sm text-[var(--muted)]">
          Session path from first touch → pages → conversion when available.
          Privacy-honest: we do <strong>not</strong> reveal organizations or
          named people from IP. {note}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No recent sessions to chart. Send traffic or use the demo seed.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.key}
              className="rounded-lg border border-[var(--line)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">
                  First touch: {row.firstTouch.source}
                  {row.firstTouch.utmCampaign
                    ? ` · ${row.firstTouch.utmCampaign}`
                    : ""}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(row.firstTouch.at).toISOString().slice(0, 16)}Z ·
                  visitor {row.visitorId.slice(0, 8)}…
                </p>
              </div>
              <ol className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {row.pages.slice(0, 12).map((p, i) => (
                  <li key={`${row.key}-${i}`} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-[var(--muted)]" aria-hidden>
                        →
                      </span>
                    )}
                    <span className="rounded bg-[var(--wash)] px-2 py-1 font-mono">
                      {p.path}
                    </span>
                  </li>
                ))}
                {row.pages.length > 12 && (
                  <li className="text-[var(--muted)]">
                    +{row.pages.length - 12} more
                  </li>
                )}
              </ol>
              {row.conversion ? (
                <p className="mt-3 text-sm text-[var(--brand)]">
                  Converted: <strong>{row.conversion.goalName}</strong>
                  {row.conversion.path ? ` at ${row.conversion.path}` : ""}
                  {row.conversion.eventName
                    ? ` · ${row.conversion.eventName}`
                    : ""}
                </p>
              ) : (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  No conversion on this session yet.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
