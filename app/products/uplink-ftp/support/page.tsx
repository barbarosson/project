import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'
import { UPLINK_FTP_LINKS } from '@/lib/uplink-ftp-links'

export const metadata: Metadata = {
  title: 'Uplink FTP Support — MODULUS',
  description:
    'Support contact for Uplink FTP (Windows FTP / FTPS / SFTP client). Email MODULUSTECH for Free vs Pro, Store, and transfer issues.',
  alternates: { canonical: 'https://modulusaas.com/products/uplink-ftp/support' },
  robots: { index: true, follow: true },
}

export default function UplinkFtpSupportPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <p className="text-sm font-medium text-slate-500">
          <Link href="/products/uplink-ftp" className="text-sky-700 underline hover:text-sky-900">
            ← Uplink FTP
          </Link>
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Uplink FTP — Support
        </h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">
          Help for the Windows desktop FTP / FTPS / SFTP client
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Publisher: {UPLINK_FTP_LINKS.publisher} / Modulus
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Contact</h2>
            <p>
              Email:{' '}
              <a
                href={`mailto:${UPLINK_FTP_LINKS.contactEmail}?subject=Uplink%20FTP%20support`}
                className="text-sky-700 underline hover:text-sky-900"
              >
                {UPLINK_FTP_LINKS.contactEmail}
              </a>
            </p>
            <p>
              General Modulus contact form:{' '}
              <Link href="/contact" className="text-sky-700 underline hover:text-sky-900">
                /contact
              </Link>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Before you write</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Note the app version from About / release notes</li>
              <li>Confirm Free vs Pro and channel (Microsoft Store vs Web / sideload)</li>
              <li>
                Attach sanitized logs only — <strong>no passwords</strong>,{' '}
                <strong>no API keys</strong>, <strong>no license keys</strong>
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Store listing</h2>
            <p>
              Product page on this site:{' '}
              <Link href="/products/uplink-ftp" className="text-sky-700 underline hover:text-sky-900">
                /products/uplink-ftp
              </Link>
            </p>
            <p>
              Microsoft Store:{' '}
              <a
                href={UPLINK_FTP_LINKS.microsoftStore}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 underline hover:text-sky-900"
              >
                apps.microsoft.com/detail/{UPLINK_FTP_LINKS.storeProductId}
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Privacy</h2>
            <p>
              <Link
                href={UPLINK_FTP_LINKS.privacy}
                className="text-sky-700 underline hover:text-sky-900"
              >
                Uplink FTP privacy policy
              </Link>
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
