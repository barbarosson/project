import { DocsShell } from "@/components/docs-shell";

export default function DocsProxyPage() {
  return (
    <DocsShell title="First-party script proxy">
      <p>
        Ad blockers often block third-party analytics hosts. Serve the SitePulse
        snippet from <strong>your</strong> domain so requests look first-party.
        This does not bypass consent laws — disclose analytics where required.
      </p>

      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Pattern
      </h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Proxy <code>/sp.js</code> (or similar) on the customer site to SitePulse{" "}
          <code>/api/script</code> or <code>/t.js</code>.
        </li>
        <li>
          Proxy <code>/api/sp/*</code> ingest/config to SitePulse{" "}
          <code>/api/ingest</code> and <code>/api/config</code> (optional but
          recommended for consistency).
        </li>
        <li>
          Install with your origin:
          <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
            {`<script defer src="https://www.yourdomain.com/sp.js" data-site="YOUR_SITE_KEY"></script>`}
          </pre>
        </li>
      </ol>

      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Next.js rewrites
      </h2>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/sp.js",
        destination: "https://YOUR_SITEPULSE_HOST/api/script",
      },
      {
        source: "/api/sp/ingest",
        destination: "https://YOUR_SITEPULSE_HOST/api/ingest",
      },
      {
        source: "/api/sp/config",
        destination: "https://YOUR_SITEPULSE_HOST/api/config",
      },
    ];
  },
};`}
      </pre>

      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        Netlify <code>_redirects</code>
      </h2>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`/sp.js  https://YOUR_SITEPULSE_HOST/api/script  200
/api/sp/ingest  https://YOUR_SITEPULSE_HOST/api/ingest  200
/api/sp/config  https://YOUR_SITEPULSE_HOST/api/config  200`}
      </pre>

      <h2
        className="pt-4 text-xl font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        SitePulse <code>/api/script</code>
      </h2>
      <p>
        Same bytes as <code>/t.js</code>, with CORS-friendly headers and{" "}
        <code>X-SitePulse-Proxy: 1</code> for debugging. Use it as the rewrite
        target when you prefer an API path over a static file.
      </p>
      <p className="text-sm">
        Honest expectation: first-party proxy reduces some filter lists; it is
        not a guarantee of 100% capture.
      </p>
    </DocsShell>
  );
}
