import { LegalPageShell } from '@/components/legal-page-shell'

export default function DistanceSalesContractPage() {
  return (
    <LegalPageShell>
      <main className="text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mesafeli Satış Sözleşmesi</h1>
        <p className="mt-4 text-slate-700">
          Bu sayfa; satıcı/alıcı bilgileri, ürün-hizmet tanımı, bedel, ödeme yöntemi, ifa/teslimat, cayma
          hakkı ve uyuşmazlık hükümlerini içermelidir.
        </p>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <section>
            <h2 className="text-base font-semibold text-slate-800">Taraflar</h2>
            <p className="mt-1">
              <strong>Satıcı:</strong> Songurtech - Barbaros Songur, Vergi Kimlik No: 7740154044, Küçükbakkalköy,
              Selvili Sok. No:4/48, 34750 Ataşehir/İstanbul. İletişim: info@modulustech.app, 0532 496 58 28.
            </p>
            <p className="mt-2">
              <strong>Alıcı:</strong> Üyelik sırasında beyan ettiğiniz bilgiler.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-800">Konu ve Bedel</h2>
            <p className="mt-1">
              Satışa konu hizmet: Modulusaas bulut tabanlı ERP (SaaS) aboneliği. Bedel, seçtiğiniz paket ve
              faturalandırma dönemine göre sitede ilan edilen güncel fiyatlar üzerinden belirlenir.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-800">Ödeme ve Teslimat</h2>
            <p className="mt-1">
              Ödeme iyzico altyapısı ile kredi/banka kartı ile alınır. Hizmet, ödeme veya kayıt onayı sonrası
              e-posta ile erişim bilgilerinin iletilmesiyle teslim edilmiş sayılır. Ayrıntılar için{' '}
              <a href="/teslimat-iade" className="text-sky-700 underline">
                Teslimat Politikası
              </a>{' '}
              ve{' '}
              <a href="/gizlilik" className="text-sky-700 underline">
                Gizlilik Politikası
              </a>{' '}
              geçerlidir.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-slate-800">Cayma Hakkı</h2>
            <p className="mt-1">
              Dijital hizmet ve cayma/iade koşulları{' '}
              <a href="/teslimat-iade#iptal-iade" className="text-sky-700 underline">
                İptal ve İade Şartları
              </a>{' '}
              sayfasında açıklanmıştır.
            </p>
          </section>
        </div>
      </main>
    </LegalPageShell>
  )
}
