import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'
import { UPLINK_FTP_LINKS } from '@/lib/uplink-ftp-links'

export const metadata: Metadata = {
  title: 'Uplink FTP Privacy Policy — MODULUS',
  description:
    'How Uplink FTP (Windows desktop FTP / FTPS / SFTP client by MODULUSTECH) handles credentials, telemetry, purchases, and optional AI keys.',
  alternates: { canonical: 'https://modulusaas.com/products/uplink-ftp/privacy' },
  robots: { index: true, follow: true },
}

export default function UplinkFtpPrivacyPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <p className="text-sm font-medium text-slate-500">
          <Link href="/products/uplink-ftp" className="text-sky-700 underline hover:text-sky-900">
            ← Uplink FTP
          </Link>
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Uplink FTP — Privacy Policy
        </h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">
          Desktop FTP / FTPS / SFTP client for Windows
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Publisher: {UPLINK_FTP_LINKS.publisher} / Modulus (Songurtech). Not legal advice.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p>
            Uplink FTP is a desktop client. By default it does <strong>not</strong> send telemetry.
            Credentials and optional keys are stored locally using OS-protected storage. We do not
            log passwords.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">1. Data controller</h2>
            <p>
              <strong>Songurtech — Barbaros Songur</strong> (trading as Modulus / MODULUSTECH)
              <br />
              Address: Küçükbakkalköy, Selvili Sok. No:4/48, 34750 Ataşehir / İstanbul, Türkiye
              <br />
              Email:{' '}
              <a
                href={`mailto:${UPLINK_FTP_LINKS.contactEmail}`}
                className="text-sky-700 underline hover:text-sky-900"
              >
                {UPLINK_FTP_LINKS.contactEmail}
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">2. Data processed on your device</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Site host, port, username, protocol, display names</strong> — Site Manager /
                quick connect; stored locally. Passwords are not stored in the site database.
              </li>
              <li>
                <strong>Passwords / private key material</strong> — Windows Credential Locker and/or
                DPAPI via the app credential store.
              </li>
              <li>
                <strong>Optional AI API key (BYOK)</strong> — only if you enable Assist and paste a
                key; stored in Credential Locker.
              </li>
              <li>
                <strong>Transfer queue state / logs and app settings</strong> — local machine only
                (timeouts, theme, TLS trust flag, telemetry opt-in).
              </li>
              <li>
                <strong>Web license key</strong> (sideload / Web channel builds) — local protected
                storage for entitlement checks.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">3. Network activity</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Connections you initiate to FTP / FTPS / SFTP servers</li>
              <li>
                Microsoft Store entitlement and purchase APIs when installed from the Store
              </li>
              <li>
                Optional AI provider HTTPS calls only if you paste an API key and use Assist
              </li>
              <li>
                Optional Web license validation on sideload builds (license key + product id) —
                Store channel uses Microsoft entitlement instead
              </li>
            </ul>
            <p>We do not sell personal data. There is no advertising SDK in the client.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">4. Purchases</h2>
            <p>
              On the Microsoft Store build, optional <strong>Uplink FTP Pro</strong> is offered as a
              durable add-on. Payment is processed by Microsoft; the app receives entitlement status
              from Store APIs. The public product Store ID is{' '}
              <code className="rounded bg-slate-100 px-1">{UPLINK_FTP_LINKS.storeProductId}</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">5. Telemetry (off by default)</h2>
            <p>
              Telemetry is <strong>opt-in</strong>. Default: disabled. When enabled in Settings, the
              app may record coarse diagnostic events (feature used, exception type + context label)
              and scrubs values that look like secrets. It does not intentionally log passwords,
              private keys, license keys, or AI API keys.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">6. Children&apos;s privacy</h2>
            <p>
              Uplink FTP is not directed at children under 13 (or the equivalent age in your
              jurisdiction).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">7. Your choices</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Leave telemetry off (default)</li>
              <li>Delete saved sites and clear credential vault entries</li>
              <li>Clear stored AI API keys in Settings</li>
              <li>Uninstall the app to remove local SQLite and settings</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">8. Contact</h2>
            <p>
              Privacy and support:{' '}
              <a
                href={`mailto:${UPLINK_FTP_LINKS.contactEmail}`}
                className="text-sky-700 underline hover:text-sky-900"
              >
                {UPLINK_FTP_LINKS.contactEmail}
              </a>
              {' · '}
              <Link
                href={UPLINK_FTP_LINKS.support}
                className="text-sky-700 underline hover:text-sky-900"
              >
                Support page
              </Link>
            </p>
            <p>
              Site-wide Modulus SaaS privacy (web products):{' '}
              <Link href="/en/privacy" className="text-sky-700 underline hover:text-sky-900">
                /en/privacy
              </Link>
              {' · '}
              <Link href="/gizlilik" className="text-sky-700 underline hover:text-sky-900">
                /gizlilik
              </Link>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">9. Changes</h2>
            <p>
              Material changes to this policy will be reflected on this page (
              <code className="rounded bg-slate-100 px-1">
                https://modulusaas.com/products/uplink-ftp/privacy
              </code>
              ) and in product release notes where applicable.
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
