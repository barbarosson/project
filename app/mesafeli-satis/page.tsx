export default function DistanceSalesContractPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Mesafeli Satış Sözleşmesi</h1>
      <p className="mt-4 text-slate-700">
        Bu sayfa; satıcı/alıcı bilgileri, ürün-hizmet tanımı, bedel, ödeme yöntemi, ifa/teslimat, cayma hakkı ve uyuşmazlık hükümlerini içermelidir.
      </p>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <section>
          <h2 className="text-base font-semibold text-slate-800">Taraflar</h2>
          <p className="mt-1">Satıcı ve alıcı bilgilerini buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">Konu ve Bedel</h2>
          <p className="mt-1">Satışa konu hizmet/ürün ve fiyatlandırma detaylarını buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">Cayma Hakkı</h2>
          <p className="mt-1">Cayma hakkı koşullarını ve istisnaları buraya ekleyin.</p>
        </section>
      </div>
    </main>
  )
}
