import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trip) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-sm text-emerald-700 hover:underline">
            ← Seyahatler
          </Link>
          <span className="text-xs font-medium uppercase text-slate-500">{trip.status}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">{trip.destination}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {trip.start_date ?? "—"} → {trip.end_date ?? "—"}
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Plan</h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {trip.plan_markdown ?? "İçerik yok."}
          </pre>
        </div>
      </main>
    </div>
  );
}
