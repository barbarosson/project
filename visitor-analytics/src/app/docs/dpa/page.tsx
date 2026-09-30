import Link from "next/link";
import { DocsShell } from "@/components/docs-shell";

export default function DocsDpaOutlinePage() {
  return (
    <DocsShell title="DPA outline">
      <p>
        This is a product outline for counsel — not legal advice. Full stub
        pages:{" "}
        <Link href="/privacy" className="text-[var(--brand)] underline">
          Privacy
        </Link>
        ,{" "}
        <Link href="/dpa" className="text-[var(--brand)] underline">
          DPA
        </Link>
        ,{" "}
        <Link href="/terms" className="text-[var(--brand)] underline">
          Terms
        </Link>
        .
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Roles:</strong> Customer = controller of site visitor data;
          SitePulse operator = processor. MoR (Lemon Squeezy) processes payment
          data under its own terms.
        </li>
        <li>
          <strong>Data:</strong> truncated IP (default), approximate device
          class, User-Agent, URL/path, referrer, UTM, session/visitor IDs
          (cookie or cookieless), conversion events, account email.
        </li>
        <li>
          <strong>Retention:</strong> raw events default 90 days (site setting);
          purge via <code>npm run retention:purge</code>. Aggregates may be kept
          longer.
        </li>
        <li>
          <strong>Sub-processors (typical):</strong> hosting/DB (Netlify +
          Supabase Postgres; Vercel optional), CDN, email (if enabled), Lemon
          Squeezy MoR, geo DB (when enabled).
        </li>
        <li>
          <strong>We do not claim</strong> “no personal data,” “cookie banner
          never required,” or indefinite retention.
        </li>
      </ul>
    </DocsShell>
  );
}
