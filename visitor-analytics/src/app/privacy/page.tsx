import { LegalShell } from "@/components/legal-shell";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        <strong>Last updated:</strong> 30 Sep 2026. Operator: TR şahıs company
        (details TBD before public launch). Product brand placeholder: SitePulse.
      </p>
      <p>
        This policy covers the SitePulse SaaS (dashboard accounts) and data we
        process when customers install our tracking snippet on their websites.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">1. Roles</h2>
      <p>
        For visitor analytics data collected via the snippet, the customer
        (website operator) is typically the <strong>controller</strong> and
        SitePulse is the <strong>processor</strong>. For account registration
        data (email, name), SitePulse is controller.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        2. Data we process (honest inventory)
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Truncated IP address (default) or full IP if truncation disabled</li>
        <li>User-Agent / derived device class</li>
        <li>Page URL/path, title, referrer, UTM parameters</li>
        <li>
          Visitor and session identifiers (first-party cookies or cookieless
          hashes)
        </li>
        <li>Custom event names and conversion records</li>
        <li>Account email and organization metadata</li>
      </ul>
      <p>
        This data <strong>may be personal data</strong>. We do not claim “no
        personal data” or that cookieless mode removes GDPR/KVKK obligations.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">3. Cookies</h2>
      <p>
        When a site uses first-party cookie mode, cookies{" "}
        <code>_sp_vid</code> / <code>_sp_sid</code> may be set. Customers are
        responsible for notices and consent where required. When{" "}
        <code>requireConsent</code> is enabled, our snippet waits for{" "}
        <code>sitepulse.consent(true)</code>.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">4. Retention</h2>
      <p>
        Default raw event retention is <strong>90 days</strong> (configurable
        per site). Customers/operators can purge expired data with the retention
        script. Account deletion: hard delete targeted within 30 days of
        request (process TBD with counsel).
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        5. Sub-processors
      </h2>
      <p>
        Primary: Netlify (app host) and Supabase (Postgres). CDN via Netlify.
        Lemon Squeezy (Merchant of Record for payments). Full list maintained
        in the DPA.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">6. Contact</h2>
      <p>
        Privacy requests: contact address TBD before launch. This stub must be
        reviewed by qualified counsel before relying on it commercially.
      </p>
    </LegalShell>
  );
}
