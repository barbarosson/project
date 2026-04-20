import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'

export const metadata: Metadata = {
  title: 'Privacy Policy — Modulus SaaS',
  description:
    'How Modulus SaaS (Songurtech) collects, uses, stores and protects your personal data across the Modulus platform, including the Modulus AppointFlow service.',
  alternates: { canonical: 'https://modulusaas.com/en/privacy' },
  robots: { index: true, follow: true },
}

export default function EnglishPrivacyPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">
          How we handle your data on modulusaas.com and Modulus AppointFlow
        </p>
        <p className="mt-2 text-sm text-slate-500">Last updated: 17 April 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p>
            This Privacy Policy explains how <strong>Songurtech</strong> (trading as &quot;Modulus
            SaaS&quot;, &quot;Modulus&quot;, &quot;we&quot;, &quot;us&quot;) collects and uses personal data
            when you visit <strong>www.modulusaas.com</strong> or use any of our products, including
            the <strong>Modulus AppointFlow</strong> appointment-automation service (the
            &quot;Service&quot;).
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">1. Data Controller</h2>
            <p>
              <strong>Songurtech — Barbaros Songur</strong>
              <br />
              Tax ID (VKN): 7740154044
              <br />
              Address: Küçükbakkalköy, Selvili Sok. No:4/48, 34750 Ataşehir / İstanbul, Türkiye
              <br />
              Email:{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              <br />
              Phone: +90 532 496 58 28
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">2. Data We Collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Account data:</strong> name, surname, email, phone, business name, country,
                preferred language and currency, password (hashed).
              </li>
              <li>
                <strong>Billing data:</strong> billing address, company tax number, invoice history.
                Card numbers, expiry dates and CVV are never stored on our systems — they are handled
                exclusively by our payment providers.
              </li>
              <li>
                <strong>Service data:</strong> appointments, calendar events, client phone numbers
                that you choose to process through AppointFlow, WhatsApp message content exchanged via
                the AI agent, agent configuration, and usage telemetry.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser, device and OS information, log
                records, timestamps, error traces.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">3. Purposes &amp; Legal Basis</h2>
            <p>We process your data to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Provide, operate and improve the Service (contract performance).</li>
              <li>Bill you and comply with tax / accounting obligations (legal obligation).</li>
              <li>
                Send transactional messages (invoices, security notices, appointment reminders) and,
                with your consent, marketing emails (consent / legitimate interest).
              </li>
              <li>Prevent fraud and secure the platform (legitimate interest).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">4. Sub-Processors</h2>
            <p>We rely on the following vetted sub-processors to deliver the Service:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> (Amazon Web Services, EU / US) — database, authentication and
                edge functions.
              </li>
              <li>
                <strong>Netlify</strong> — web hosting and CDN.
              </li>
              <li>
                <strong>Lemon Squeezy</strong> — global payment processing and Merchant of Record for
                international customers.
              </li>
              <li>
                <strong>iyzico</strong> — local payment processing for Turkish customers.
              </li>
              <li>
                <strong>Meta Platforms Ireland Ltd.</strong> — WhatsApp Cloud API for message delivery.
              </li>
              <li>
                <strong>Google LLC</strong> — Google Calendar API for two-way appointment sync (only
                when you connect your calendar).
              </li>
              <li>
                <strong>OpenAI</strong> — language-model inference for the AI agent. We send only the
                minimum conversational context needed to generate a reply.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">5. International Transfers</h2>
            <p>
              Some of our sub-processors are located outside Türkiye and the EU. Transfers are made
              under Standard Contractual Clauses or equivalent safeguards. You may contact us for a
              copy of the applicable safeguards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">6. Retention</h2>
            <p>
              Account and billing records are retained for the duration of your subscription and for
              up to ten (10) years afterwards where required by Turkish accounting and tax law. Service
              telemetry is retained for up to twelve (12) months. You may request deletion of your
              account at any time — see Section 7.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">7. Your Rights</h2>
            <p>
              Subject to applicable law (KVKK, GDPR, UK GDPR, CCPA and similar), you have the right to
              access, rectify, erase, restrict or object to the processing of your personal data, to
              receive your data in a portable format, and to withdraw consent. To exercise any right,
              email{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and fraud prevention, and optional analytics
              cookies to understand how the marketing site is used. You can disable optional cookies in
              your browser at any time without affecting core Service functionality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">9. Changes</h2>
            <p>
              We may update this policy. Material changes will be notified by email and announced on
              this page at least 15 days before they take effect.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
            <p>
              For any privacy-related question or request, please email{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              . Turkish-language version of this policy is available at{' '}
              <a href="/gizlilik" className="text-sky-700 underline hover:text-sky-900">
                /gizlilik
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
