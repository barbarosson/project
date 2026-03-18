import { LegalPageShell } from '@/components/legal-page-shell'

export default function AboutPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hakkımızda</h1>
        <p className="mt-4 leading-relaxed">
          <strong>Modulusaas</strong> (www.modulusaas.com), Songurtech tarafından sunulan bulut tabanlı ERP
          yazılım hizmetidir (SaaS). İşletmelerin operasyonlarını dijital ortamda yönetmesine yardımcı
          olmayı hedefleriz.
        </p>
        <div className="mt-8 space-y-3 text-sm leading-relaxed">
          <p>
            <span className="font-semibold text-slate-900">Ticari Ünvan:</span> Songurtech - Barbaros Songur
          </p>
          <p>
            <span className="font-semibold text-slate-900">Vergi Kimlik No:</span> 7740154044
          </p>
          <p>
            <span className="font-semibold text-slate-900">Adres:</span> Küçükbakkalköy, Selvili Sok.
            No:4/48, 34750 Ataşehir/İstanbul
          </p>
          <p>
            <span className="font-semibold text-slate-900">E-posta:</span>{' '}
            <a href="mailto:info@modulustech.app" className="text-sky-700 hover:underline">
              info@modulustech.app
            </a>
          </p>
          <p>
            <span className="font-semibold text-slate-900">Telefon:</span>{' '}
            <a href="tel:+905324965828" className="text-sky-700 hover:underline">
              0532 496 58 28
            </a>
          </p>
          <p>
            <span className="font-semibold text-slate-900">Web:</span>{' '}
            <a
              href="https://www.modulusaas.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:underline"
            >
              www.modulusaas.com
            </a>
          </p>
        </div>
      </main>
    </LegalPageShell>
  )
}
