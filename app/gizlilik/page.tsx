import { LegalPageShell } from '@/components/legal-page-shell'

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Gizlilik Politikası (Privacy Policy)
        </h1>
        <p className="mt-2 text-lg font-semibold text-slate-800">
          Gizlilik Politikası ve Kişisel Verilerin Korunması
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <p>
            Modulusaas olarak, kullanıcılarımızın verilerinin güvenliği ve gizliliği bizim için en üst
            önceliktir. İşbu politika, <strong>www.modulusaas.com</strong> üzerinden toplanan verilerin nasıl
            işlendiğini açıklar.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Veri Sorumlusu</h2>
            <p>Songurtech - Barbaros Songur</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Adres</h2>
            <p>Küçükbakkalköy, Selvili Sok. No:4/48, 34750 Ataşehir/İstanbul</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Vergi Kimlik No</h2>
            <p>7740154044</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Toplanan Veriler</h2>
            <p>
              Üyelik sırasında paylaştığınız ad, soyad, e-posta, telefon ve fatura bilgileriniz; hizmetin
              kullanımı sırasında oluşan kullanım verileri ve log kayıtlarıdır.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Ödeme Güvenliği</h2>
            <p>
              Ödeme sayfamızda kredi kartı bilgileriniz doğrudan iyzico altyapısına iletilir. Songurtech
              sistemlerinde kredi kartı numaranız, son kullanma tarihiniz ve CVV kodu gibi hassas veriler
              asla kaydedilmez ve saklanmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">İletişim</h2>
            <p>
              Verilerinizle ilgili her türlü talep ve soru için{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>{' '}
              adresinden veya{' '}
              <a href="tel:+905324965828" className="text-sky-700 underline hover:text-sky-900">
                0532 496 58 28
              </a>{' '}
              numaralı telefondan bize ulaşabilirsiniz.
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
