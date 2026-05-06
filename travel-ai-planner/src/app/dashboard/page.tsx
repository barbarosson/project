import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: trips } = await supabase
    .from("trips")
    .select("id,destination,start_date,end_date,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold text-slate-900">
            Adventora.ai
          </Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/planner" className="hover:text-slate-900">
              Planlayıcı
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="hover:text-slate-900">
                Çıkış
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-500">Hoş geldin</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {user?.email ?? "Gezgin"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kayıtlı seyahat planların. Yeni plan için{" "}
          <Link href="/planner" className="font-medium text-emerald-700 underline">
            planlayıcıyı
          </Link>{" "}
          aç.
        </p>
        <div className="mt-8 space-y-3">
          {(trips ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              Henüz kayıtlı seyahat yok.
            </div>
          ) : (
            (trips ?? []).map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{t.destination}</p>
                    <p className="text-xs text-slate-500">
                      {t.start_date ?? "?"} — {t.end_date ?? "?"} · {t.status}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-700">Detay →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
