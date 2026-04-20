import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Modulus SaaS',
  description:
    'Refund, cancellation and right-of-withdrawal policy for Modulus SaaS subscriptions including Modulus AppointFlow.',
  alternates: { canonical: 'https://modulusaas.com/en/refund' },
  robots: { index: true, follow: true },
}

export default function EnglishRefundPage() {
  return (
    <LegalPageShell>
      <main className="space-y-10 text-sm leading-relaxed text-slate-700">
        <section id="refund">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            Right of withdrawal, cancellations, refunds and delivery timing
          </p>
          <p className="mt-2 text-sm text-slate-500">Last updated: 17 April 2026</p>

          <p className="mt-6">
            This policy applies to subscriptions to Modulus SaaS products, including{' '}
            <strong>Modulus AppointFlow</strong>, purchased on{' '}
            <strong>www.modulusaas.com</strong> by customers worldwide. Because Modulus is a
            cloud-hosted Software-as-a-Service, it is a &quot;digital service performed
            instantaneously by electronic means&quot; for the purposes of distance-sales legislation.
          </p>

          <ul className="mt-6 list-disc space-y-4 pl-5">
            <li>
              <strong>Free trial.</strong> Every Modulus AppointFlow plan starts with a{' '}
              <strong>7-day free trial</strong>. The core Modulus SaaS ERP plans offer a{' '}
              <strong>14-day free trial</strong>. No charge is made during the trial and no credit
              card is required to start.
            </li>
            <li>
              <strong>Cancellation.</strong> You may cancel your monthly or annual subscription at any
              time from your customer dashboard or by emailing{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              . Cancellation takes effect at the end of the current billing period; no further
              charges will be made for subsequent periods.
            </li>
            <li>
              <strong>Right of withdrawal.</strong> Under Turkish and EU distance-sales rules, digital
              services that begin to be supplied immediately after payment are exempt from the standard
              14-day right of withdrawal once the customer has expressly consented to immediate
              performance. If, however, the Service is not delivered as described due to a technical
              failure on our side, you may request a refund within <strong>7 days</strong> of payment
              by contacting us.
            </li>
            <li>
              <strong>Refund eligibility.</strong> Refunds are granted at our reasonable discretion
              when (a) the Service is materially unavailable for an extended period due to our fault,
              (b) you were charged twice in error, or (c) you are within the first 7 days of a
              first-time paid period and have not materially used the Service. Abuse of the refund
              mechanism, accounts banned for terms-of-service violations, or requests made after the
              7-day window generally do not qualify.
            </li>
            <li>
              <strong>How refunds are processed.</strong> For international customers, refunds are
              issued by <strong>Lemon Squeezy</strong> (our Merchant of Record) to the original payment
              method. For customers who paid through iyzico in Türkiye, refunds are issued through
              iyzico to the original card. Funds typically appear in your account within{' '}
              <strong>2 – 10 business days</strong>, depending on your bank.
            </li>
            <li>
              <strong>How to request.</strong> Email{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>{' '}
              with your order number, the email address used at checkout and a short description of
              the reason. We respond within 3 business days.
            </li>
          </ul>
        </section>

        <section id="delivery">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Policy</h2>
          <p className="mt-4 text-base font-semibold text-slate-800">How the Service is delivered</p>
          <ul className="mt-6 list-disc space-y-4 pl-5">
            <li>
              <strong>Nature of delivery.</strong> Modulus is a cloud-based SaaS — there is no physical
              shipment, carrier or tracking number.
            </li>
            <li>
              <strong>Delivery time.</strong> Immediately after successful signup or payment, account
              credentials and a welcome email are sent to the email address you provided. Your tenant
              is provisioned within seconds; most customers are able to use the Service in under two
              minutes.
            </li>
            <li>
              <strong>Access problems.</strong> If you do not receive your welcome email or cannot log
              in, please email{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>
              . We aim to respond within one business day and restore access at no extra cost.
            </li>
          </ul>
        </section>

        <section>
          <p className="text-xs text-slate-500">
            Turkish version of this policy is available at{' '}
            <a href="/teslimat-iade" className="text-sky-700 underline hover:text-sky-900">
              /teslimat-iade
            </a>
            . In case of any discrepancy between the two versions, the Turkish version prevails for
            customers whose billing address is in Türkiye; the English version prevails for all other
            customers.
          </p>
        </section>
      </main>
    </LegalPageShell>
  )
}
