import { DocsShell } from "@/components/docs-shell";

export default function DocsInstallPage() {
  return (
    <DocsShell title="Install snippet">
      <p>Paste before the closing <code>&lt;/head&gt;</code> on your site:</p>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`<script defer src="https://YOUR_HOST/t.js" data-site="YOUR_SITE_KEY"></script>`}
      </pre>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Identity modes
      </h2>
      <p>
        Configured per site in the dashboard. The snippet loads{" "}
        <code>/api/config?k=KEY</code> automatically.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>First-party cookie</strong> — sets <code>_sp_vid</code> /{" "}
          <code>_sp_sid</code>. Disclose cookies to visitors where required.
        </li>
        <li>
          <strong>Cookieless</strong> — no persistent client ID; visitor hash
          derived server-side from truncated IP + UA + day. Still may be personal
          data.
        </li>
      </ul>
      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Consent gate
      </h2>
      <p>
        Enable <strong>Require consent</strong> in site settings. The snippet
        will not send events until:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`sitepulse.consent(true);`}
      </pre>
      <p>
        Call this from your CMP / cookie banner after the visitor accepts
        analytics. <code>sitepulse.consent(false)</code> stops further tracking
        (does not erase historical data).
      </p>
    </DocsShell>
  );
}
