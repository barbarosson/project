export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Gizlilik Sözleşmesi</h1>
      <p className="mt-4 text-slate-700">
        Bu sayfa; hangi kişisel verilerin işlendiği, işleme amaçları, saklama süreleri, aktarım ve KVKK hakları gibi bilgileri içermelidir.
      </p>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <section>
          <h2 className="text-base font-semibold text-slate-800">Toplanan Veriler</h2>
          <p className="mt-1">Hesap oluşturma, ödeme ve kullanım sırasında toplanan verileri buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">Çerezler</h2>
          <p className="mt-1">Kullanılan çerez türleri ve amaçlarını buraya ekleyin.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-800">Haklar</h2>
          <p className="mt-1">KVKK kapsamındaki başvuru yöntemini ve iletişim kanalını buraya ekleyin.</p>
        </section>
      </div>
    </main>
  )
}
