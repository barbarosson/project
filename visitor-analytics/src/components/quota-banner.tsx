export function QuotaBanner({
  usagePct,
  used,
  limit,
  softWarning,
  hardExceeded,
  planLabel,
}: {
  usagePct: number;
  used: number;
  limit: number;
  softWarning: boolean;
  hardExceeded: boolean;
  planLabel: string;
}) {
  // Soft warning defaults to 90% of monthly pageview limit (in-app only; no email in M4)
  if (!softWarning && !hardExceeded) return null;
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        borderColor: hardExceeded ? "var(--danger)" : "var(--accent)",
        background: hardExceeded
          ? "color-mix(in srgb, var(--danger) 8%, white)"
          : "color-mix(in srgb, var(--accent) 10%, white)",
      }}
    >
      <strong>
        {hardExceeded
          ? "Quota exceeded"
          : usagePct >= 90
            ? "Quota warning (90%+)"
            : "Approaching quota"}
      </strong>
      {" — "}
      {planLabel}: {used.toLocaleString()} / {limit.toLocaleString()} PV (
      {usagePct}%). In-app notice only (no email provider in M4).{" "}
      <a href="/billing" className="font-semibold underline">
        View billing
      </a>
    </div>
  );
}
