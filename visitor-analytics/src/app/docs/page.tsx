import Link from "next/link";
import { DocsShell } from "@/components/docs-shell";

export default function DocsHomePage() {
  return (
    <DocsShell title="Documentation">
      <p>
        SitePulse is privacy-honest website analytics for agencies: pageviews,
        sessions, conversions, and funnels — with cookie or cookieless identity
        per site.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <Link href="/docs/install" className="text-[var(--brand)] underline">
            Install the snippet
          </Link>
        </li>
        <li>
          <Link href="/docs/events" className="text-[var(--brand)] underline">
            Events / ingest API
          </Link>
        </li>
        <li>
          <Link
            href="/docs/conversions"
            className="text-[var(--brand)] underline"
          >
            Conversions &amp; funnels
          </Link>
        </li>
        <li>
          <Link href="/docs/dpa" className="text-[var(--brand)] underline">
            DPA outline
          </Link>
        </li>
      </ul>
      <p>
        We do <strong>not</strong> claim “no personal data.” Truncated IP,
        user-agent, and visitor/session identifiers can be personal data under
        GDPR/KVKK. Default raw retention is <strong>90 days</strong>.
      </p>
    </DocsShell>
  );
}
