import { DocsShell } from "@/components/docs-shell";

export default function DocsEventsPage() {
  return (
    <DocsShell title="Events API">
      <p>
        Browser snippet posts JSON to <code>POST /api/ingest</code>. CORS is
        open for beacon use; authenticate with the site public key{" "}
        <code>k</code>.
      </p>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Pageview
      </h2>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`{
  "k": "sp_…",
  "type": "pageview",
  "path": "/pricing",
  "url": "https://example.com/pricing?utm_source=newsletter",
  "title": "Pricing",
  "referrer": "https://google.com/",
  "visitorId": "…",   // required in cookie mode
  "sessionId": "…"
}`}
      </pre>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Custom event
      </h2>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`sitepulse.track('signup_complete');
// or
sitepulse.event('signup_complete');`}
      </pre>
      <p>
        Payload uses <code>type: &quot;event&quot;</code> and{" "}
        <code>eventName</code>. UTM fields are parsed from <code>url</code>.
        Over monthly pageview quota, ingest returns HTTP <code>429</code>.
      </p>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Config
      </h2>
      <p>
        <code>GET /api/config?k=KEY</code> →{" "}
        <code>{`{ identityMode, requireConsent, domain }`}</code>
      </p>
    </DocsShell>
  );
}
