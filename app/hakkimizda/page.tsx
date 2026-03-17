export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Hakkımızda</h1>
      <p className="mt-4 text-slate-700">
        Bu sayfa, firmanızın ünvanı, adresi, iletişim bilgileri ve hizmet kapsamı gibi kurumsal bilgileri içermelidir.
      </p>
      <div className="mt-6 space-y-2 text-sm text-slate-600">
        <p><span className="font-medium text-slate-800">Ticari Ünvan:</span> (Buraya ekleyin)</p>
        <p><span className="font-medium text-slate-800">MERSİS / Vergi No:</span> (Buraya ekleyin)</p>
        <p><span className="font-medium text-slate-800">Adres:</span> (Buraya ekleyin)</p>
        <p><span className="font-medium text-slate-800">E-posta:</span> (Buraya ekleyin)</p>
        <p><span className="font-medium text-slate-800">Telefon:</span> (Buraya ekleyin)</p>
      </div>
    </main>
  )
}
