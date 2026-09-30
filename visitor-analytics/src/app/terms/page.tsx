import { LegalShell } from "@/components/legal-shell";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        <strong>Last updated:</strong> 30 Sep 2026. Placeholder brand: SitePulse.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">1. Service</h2>
      <p>
        SitePulse provides website analytics tooling (snippet, ingest, dashboard)
        on a subscription basis. Features evolve; beta functionality may change.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">2. Accounts</h2>
      <p>
        You must provide accurate registration information and keep credentials
        secure. You are responsible for activity under your organization,
        including client invites.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">3. Acceptable use</h2>
      <p>
        Do not use the service to violate law, scrape unlawfully, or circumvent
        quotas. Session replay / invasive tracking features are intentionally
        out of scope.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">4. Billing</h2>
      <p>
        Paid plans are billed in USD via a Merchant of Record (Lemon Squeezy).
        Taxes/invoices are handled by the MoR. No lifetime / AppSumo LTD offers
        in the first 12 months of public launch. Soft quota warnings and hard
        ingest limits may apply.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">5. Data & privacy</h2>
      <p>
        Customer websites remain responsible for lawful collection. See Privacy
        Policy and DPA stubs. Marketing claims must not contradict the data
        inventory (no “no personal data” positioning).
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">6. Liability</h2>
      <p>
        Service is provided as-is during bootstrap. Liability caps and warranty
        disclaimers will be finalized with counsel before paid launch.
      </p>
    </LegalShell>
  );
}
