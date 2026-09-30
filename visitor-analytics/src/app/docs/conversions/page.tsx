import { DocsShell } from "@/components/docs-shell";

export default function DocsConversionsPage() {
  return (
    <DocsShell title="Conversions & funnels">
      <h2
        className="text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Conversion goals
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>URL</strong> — match path exact or prefix on pageviews (e.g.{" "}
          <code>/thanks</code>).
        </li>
        <li>
          <strong>Event</strong> — match custom event name (e.g.{" "}
          <code>signup_complete</code>).
        </li>
      </ul>
      <p>
        One conversion is counted per session per goal. UTM captured at ingest
        is copied onto the conversion row for source breakdowns.
      </p>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Funnels
      </h2>
      <p>
        Define 2–5 ordered steps (URL or event). Drop-off is session-based: each
        step must occur after the previous step in the same session within the
        selected window (7 or 30 days).
      </p>
      <p>
        Export CSV of pageviews or conversions from the site dashboard (last 30
        days).
      </p>
    </DocsShell>
  );
}
