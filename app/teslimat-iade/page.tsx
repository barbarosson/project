export default function ShippingReturnsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Teslimat ve İade Şartları</h1>
      <p className="mt-4 text-slate-700">
        Bu sayfa; teslimat yöntemleri/süreleri, kargo ücretleri, cayma hakkı ve iade süreçleri gibi bilgileri içermelidir.
      </p>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <section>
          <h2 className="text-base font-semibold text-slate-800">Teslimat</h2>
          <p className="mt-1">Teslimat koşullarınızı (dijital hizmet/ürün, aktivasyon, kargo vb.) buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">İade ve Cayma Hakkı</h2>
          <p className="mt-1">İade/cayma şartlarınızı ve başvuru kanalınızı buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">İletişim</h2>
          <p className="mt-1">İade talepleri için iletişim bilgilerinizi buraya ekleyin.</p>
        </section>
      </div>
    </main>
  )
}
