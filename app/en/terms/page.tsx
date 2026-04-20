import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'

export const metadata: Metadata = {
  title: 'Terms of Service — Modulus SaaS',
  description:
    'Terms of Service governing your use of the Modulus SaaS platform and the Modulus AppointFlow appointment-automation product.',
  alternates: { canonical: 'https://modulusaas.com/en/terms' },
  robots: { index: true, follow: true },
}

export default function EnglishTermsPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">
          Legal agreement between you and Songurtech (Modulus SaaS)
        </p>
        <p className="mt-2 text-sm text-slate-500">Last updated: 17 April 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p>
            These Terms of Service (the &quot;Terms&quot;) govern your access to and use of
            www.modulusaas.com and any product, dashboard, API or feature offered under the
            &quot;Modulus SaaS&quot; or &quot;Modulus&quot; brand, including{' '}
            <strong>Modulus AppointFlow</strong> (together, the &quot;Service&quot;). By creating an
            account or paying for a subscription, you agree to these Terms.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">1. The Provider</h2>
            <p>
              The Service is provided by <strong>Songurtech — Barbaros Songur</strong> (Tax ID
              7740154044), Küçükbakkalköy, Selvili Sok. No:4/48, 34750 Ataşehir / İstanbul, Türkiye
              (&quot;Provider&quot;, &quot;we&quot;, &quot;us&quot;). Contact:{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              , +90 532 496 58 28.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">2. Accounts &amp; Eligibility</h2>
            <p>
              You must be at least 18 years old and legally able to enter into a binding contract. You
              are responsible for keeping your credentials confidential and for every action taken
              under your account. You must give us accurate and up-to-date contact and billing
              information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">3. Subscription &amp; Billing</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Subscriptions are sold on a <strong>monthly</strong> or <strong>annual</strong> basis
                and renew automatically at the start of each period until cancelled.
              </li>
              <li>
                Prices are displayed in the currency of checkout. Where we show multiple currencies,
                the currency selected during checkout is definitive. Applicable sales tax or VAT is
                added by the Merchant of Record where required.
              </li>
              <li>
                International payments are processed by <strong>Lemon Squeezy</strong>, which acts as
                the Merchant of Record and is responsible for global tax remittance. Turkish customers
                may be charged via <strong>iyzico</strong>.
              </li>
              <li>
                Cancellation, refund and withdrawal rights are described in our{' '}
                <a href="/en/refund" className="text-sky-700 underline hover:text-sky-900">
                  Refund &amp; Cancellation Policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">4. Acceptable Use</h2>
            <p>You agree not to, and not to permit any third party to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Use the Service to send unsolicited bulk messages, phishing, spam or any content that
                violates WhatsApp Business policies or applicable marketing law.
              </li>
              <li>
                Upload or process personal data of individuals for whom you do not have a lawful basis
                to process.
              </li>
              <li>
                Reverse-engineer, scrape or interfere with the Service, probe its security, or attempt
                to access accounts that are not yours.
              </li>
              <li>
                Use the Service for illegal activity, to harm minors, or to promote violence, hate or
                fraud.
              </li>
            </ul>
            <p>
              We may suspend or terminate accounts that breach this section, with or without notice,
              and without refund where material abuse is established.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">5. Third-Party Services</h2>
            <p>
              Modulus AppointFlow relies on third-party platforms such as WhatsApp Cloud API (Meta),
              Google Calendar (Google), OpenAI (for language-model inference), Lemon Squeezy and
              Supabase. Their availability, policies and fair-use limits apply when you use features
              that depend on them. We are not responsible for outages, policy changes or account
              suspensions imposed by those third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">6. Data &amp; Privacy</h2>
            <p>
              Our processing of personal data is described in our{' '}
              <a href="/en/privacy" className="text-sky-700 underline hover:text-sky-900">
                Privacy Policy
              </a>
              . You retain ownership of the data you upload to the Service and grant us a worldwide,
              royalty-free licence to host and process it strictly for the purpose of providing the
              Service to you.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">7. Intellectual Property</h2>
            <p>
              All right, title and interest in the Service — including software, models, designs,
              trademarks and documentation — belongs to Songurtech or its licensors. You receive only a
              limited, non-exclusive, non-transferable right to use the Service during your paid
              subscription.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">8. Availability &amp; Support</h2>
            <p>
              We aim for 99.5% monthly uptime measured at the application edge and provide
              best-effort support by email during Turkish business hours. Planned maintenance will be
              announced in advance whenever reasonably possible.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              9. Warranty Disclaimer &amp; Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, the Service is provided &quot;AS IS&quot; and
              &quot;AS AVAILABLE&quot; without warranties of any kind. Our aggregate liability for any
              claim arising out of or in connection with these Terms is limited to the amount you paid
              us for the Service in the twelve (12) months preceding the event giving rise to the
              claim. We are not liable for indirect, incidental, special, consequential or
              exemplary damages, or for loss of profits, revenue, data or goodwill.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">10. Termination</h2>
            <p>
              You may terminate your subscription at any time by cancelling inside the dashboard or by
              emailing us. We may terminate or suspend your account for material breach of these
              Terms, non-payment, or if required by law. Upon termination, we will retain your data
              for up to 30 days before irreversible deletion, unless a longer retention is required by
              law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">11. Governing Law &amp; Venue</h2>
            <p>
              These Terms are governed by the laws of the Republic of Türkiye. The courts and
              enforcement offices of İstanbul (Anadolu) shall have exclusive jurisdiction, without
              prejudice to any mandatory consumer-protection rights available in your country of
              residence.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">12. Changes</h2>
            <p>
              We may revise these Terms from time to time. Material changes will be announced by email
              and on this page at least 15 days before they take effect. Continued use of the Service
              after the effective date constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">13. Contact</h2>
            <p>
              Questions about these Terms should be sent to{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              . Turkish customers may also refer to the{' '}
              <a href="/mesafeli-satis" className="text-sky-700 underline hover:text-sky-900">
                Mesafeli Satış Sözleşmesi
              </a>{' '}
              and{' '}
              <a href="/teslimat-iade" className="text-sky-700 underline hover:text-sky-900">
                İptal ve İade Şartları
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
