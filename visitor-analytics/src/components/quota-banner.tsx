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
      <strong>{hardExceeded ? "Quota exceeded" : "Approaching quota"}</strong>
      {" — "}
      {planLabel}: {used.toLocaleString()} / {limit.toLocaleString()} PV (
      {usagePct}%).{" "}
      <a href="/billing" className="font-semibold underline">
        View billing
      </a>
    </div>
  );
}
