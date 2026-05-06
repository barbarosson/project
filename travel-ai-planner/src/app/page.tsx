import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Adventora.ai
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Otonom seyahat ajanı için iskelet
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Profil + Google OAuth + Supabase + RAG (pgvector) + kayıtlı seyahatler. Üretimde yalnızca
          anahtarları yapılandırman yeterli.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/planner"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Planlayıcıyı aç
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Giriş / Kayıt
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-transparent px-6 py-3 text-sm font-semibold text-slate-300 underline-offset-4 hover:text-white hover:underline"
          >
            Panel
          </Link>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Profil & hafıza",
              d: "Onboarding + JSON tercihler; plan API profili otomatik bağlar.",
            },
            {
              t: "RAG",
              d: "destination_documents + match_destination_docs; seed endpoint ile örnek içerik.",
            },
            {
              t: "Seyahat defteri",
              d: "Plan üret, kaydet, panelde listele.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-sm font-semibold text-emerald-300">{x.t}</p>
              <p className="mt-2 text-sm text-slate-400">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
