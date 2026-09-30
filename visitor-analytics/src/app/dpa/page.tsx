import { LegalShell } from "@/components/legal-shell";

export default function DpaPage() {
  return (
    <LegalShell title="Data Processing Agreement (stub)">
      <p>
        <strong>Status:</strong> Outline for attorney review — not an executed
        DPA. Aligns with privacy-honest product positioning (no VT-style FAQ
        contradiction).
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">1. Parties</h2>
      <p>
        Customer (“Controller”) and SitePulse operator (“Processor”). Payment
        processing via Lemon Squeezy may involve separate controller/processor
        roles for payment data.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        2. Subject matter
      </h2>
      <p>
        Processing of website analytics events and related identifiers on behalf
        of Controller to provide the SitePulse service.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        3. Categories of data
      </h2>
      <p>
        Truncated IP (default), User-Agent, URLs, referrers, UTMs, cookie or
        cookieless identifiers, custom events, conversion records. May include
        personal data.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">4. Duration</h2>
      <p>
        For the subscription term. Raw events retained per site setting
        (default 90 days) then eligible for purge. Upon account deletion,
        Processor will delete or return personal data within a documented window
        (target 30 days) except where law requires retention.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        5. Sub-processors
      </h2>
      <p>
        Netlify (hosting), Supabase (Postgres), CDN, transactional email (if
        used), Lemon Squeezy (MoR), optional geo providers. Customer will be
        notified of material changes per counsel-approved process.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        6. International transfers
      </h2>
      <p>
        Primary region TBD (eu-west vs us-east). Transfer mechanisms (SCCs /
        KVKK equivalents) to be completed with counsel before launch.
      </p>
      <h2 className="text-lg font-semibold text-[var(--ink)]">7. Security</h2>
      <p>
        Access controls for the dashboard, hashed passwords, site-scoped ingest
        keys, optional IP truncation. Continuous improvement; no SOC2 claim yet.
      </p>
    </LegalShell>
  );
}
