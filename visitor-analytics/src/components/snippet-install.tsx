"use client";

import { useState } from "react";

export function SnippetInstall({
  appUrl,
  siteKey,
}: {
  appUrl: string;
  siteKey: string;
}) {
  const snippet = `<script defer src="${appUrl}/t.js" data-site="${siteKey}"></script>`;
  const [copied, setCopied] = useState(false);

  return (
    <section className="sp-card p-5">
      <h2 className="text-lg font-semibold">Install snippet</h2>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Paste before <code>&lt;/head&gt;</code> on your site. The snippet loads
        identity mode from SitePulse automatically.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {snippet}
      </pre>
      <p className="mt-4 text-sm text-[var(--muted)]">Custom event (conversion):</p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`sitepulse.track('signup_complete');`}
      </pre>
      <p className="mt-4 text-sm text-[var(--muted)]">
        If &quot;Require consent&quot; is enabled in site settings:
      </p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--ink)] p-4 text-xs text-[#e8f5ef]">
        {`sitepulse.consent(true); // after analytics consent`}
      </pre>
      <button
        type="button"
        className="sp-btn sp-btn-ghost mt-3"
        onClick={async () => {
          await navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy snippet"}
      </button>
    </section>
  );
}
