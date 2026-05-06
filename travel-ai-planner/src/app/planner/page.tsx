"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type TripStyle =
  | "budget"
  | "comfort"
  | "luxury"
  | "family"
  | "romantic"
  | "adventure"
  | "culture"
  | "food"
  | "beach";

type PlannerInput = {
  origin?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  days: number;
  people: number;
  budget?: number;
  currency: "TRY" | "USD" | "EUR";
  style: TripStyle;
  interests: string;
  constraints?: string;
  pace: "relaxed" | "balanced" | "packed";
};

export default function PlannerPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [form, setForm] = useState<PlannerInput>({
    origin: "",
    destination: "İstanbul",
    startDate: "",
    endDate: "",
    days: 4,
    people: 2,
    budget: undefined,
    currency: "TRY",
    style: "culture",
    interests: "müze, yürüyüş, iyi yemek, fotoğraf",
    constraints: "",
    pace: "balanced",
  });
  const [saveTrip, setSaveTrip] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("");
  const [tripId, setTripId] = useState<string | null>(null);
  const [ragMeta, setRagMeta] = useState<{ title: string; source_url?: string | null }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setSessionEmail(data.session?.user.email ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const datePart =
      form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : `${form.days} gün`;
    const budgetPart = form.budget
      ? `${form.budget.toLocaleString()} ${form.currency}`
      : "Bütçe: belirtilmedi";
    return `${form.destination} • ${datePart} • ${form.people} kişi • ${budgetPart} • Tempo: ${form.pace}`;
  }, [form]);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan("");
    setTripId(null);
    setRagMeta([]);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          saveTrip: sessionEmail ? saveTrip : false,
        }),
      });

      const data = (await res.json()) as {
        plan?: string;
        error?: string;
        tripId?: string;
        ragSources?: { title: string; source_url?: string | null }[];
      };
      if (!res.ok) throw new Error(data.error || "Plan üretilemedi.");
      if (!data.plan) throw new Error("Boş yanıt alındı.");
      setPlan(data.plan);
      if (data.tripId) setTripId(data.tripId);
      if (data.ragSources?.length) setRagMeta(data.ragSources);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            Adventora
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {sessionEmail ? (
              <>
                <span className="hidden text-slate-500 sm:inline">{sessionEmail}</span>
                <Link href="/dashboard" className="text-emerald-700 hover:underline">
                  Panel
                </Link>
              </>
            ) : (
              <Link href="/login?next=/planner" className="text-emerald-700 hover:underline">
                Giriş yap
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            RAG + profil bağlamı
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            AI tatil planlayıcı
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Giriş yaptıysan profilin otomatik eklenir; kayıtlı içerikler (vektör) varsa plana
            yedirilir.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Plan detayları</h2>
                <p className="mt-1 text-sm text-slate-600">{summary}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    origin: "",
                    destination: "İstanbul",
                    startDate: "",
                    endDate: "",
                    days: 4,
                    people: 2,
                    budget: undefined,
                    currency: "TRY",
                    style: "culture",
                    interests: "müze, yürüyüş, iyi yemek, fotoğraf",
                    constraints: "",
                    pace: "balanced",
                  });
                  setPlan("");
                  setError(null);
                  setTripId(null);
                  setRagMeta([]);
                }}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Sıfırla
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Kalkış (opsiyonel)">
                <input
                  value={form.origin || ""}
                  onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
                  placeholder="Ankara"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Varış / Destinasyon">
                <input
                  value={form.destination}
                  onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                  placeholder="Roma"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Başlangıç (opsiyonel)">
                <input
                  type="date"
                  value={form.startDate || ""}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Bitiş (opsiyonel)">
                <input
                  type="date"
                  value={form.endDate || ""}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Gün sayısı">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.days}
                  onChange={(e) => setForm((p) => ({ ...p, days: Number(e.target.value || 1) }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Kişi sayısı">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.people}
                  onChange={(e) => setForm((p) => ({ ...p, people: Number(e.target.value || 1) }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Bütçe (opsiyonel)">
                <input
                  type="number"
                  min={0}
                  value={form.budget ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      budget: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  placeholder="25000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Para birimi">
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currency: e.target.value as PlannerInput["currency"] }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Stil">
                <select
                  value={form.style}
                  onChange={(e) => setForm((p) => ({ ...p, style: e.target.value as TripStyle }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="budget">Bütçe dostu</option>
                  <option value="comfort">Konfor</option>
                  <option value="luxury">Lüks</option>
                  <option value="family">Aile</option>
                  <option value="romantic">Romantik</option>
                  <option value="adventure">Macera</option>
                  <option value="culture">Kültür</option>
                  <option value="food">Gastronomi</option>
                  <option value="beach">Deniz</option>
                </select>
              </Field>

              <Field label="Tempo">
                <select
                  value={form.pace}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pace: e.target.value as PlannerInput["pace"] }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="relaxed">Rahat</option>
                  <option value="balanced">Dengeli</option>
                  <option value="packed">Yoğun</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="İlgi alanları">
                <textarea
                  value={form.interests}
                  onChange={(e) => setForm((p) => ({ ...p, interests: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <Field label="Kısıtlar (opsiyonel)">
                <textarea
                  value={form.constraints || ""}
                  onChange={(e) => setForm((p) => ({ ...p, constraints: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              {sessionEmail && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={saveTrip}
                    id="saveTrip"
                    onChange={(e) => setSaveTrip(e.target.checked)}
                  />
                  Bu planı hesabıma kaydet
                </label>
              )}

              <button
                type="button"
                onClick={generatePlan}
                disabled={loading || !form.destination.trim()}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Plan hazırlanıyor…" : "Planı oluştur"}
              </button>

              {tripId && (
                <p className="text-sm text-emerald-700">
                  Kaydedildi:{" "}
                  <Link href={`/trips/${tripId}`} className="font-medium underline">
                    Seyahati aç
                  </Link>
                </p>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Plan çıktısı</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Markdown. RAG kaynakları varsa altta listelenir.
                </p>
              </div>
              {plan && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(plan);
                  }}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Kopyala
                </button>
              )}
            </div>

            {ragMeta.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">RAG kaynakları</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {ragMeta.map((r) => (
                    <li key={r.title + (r.source_url ?? "")}>
                      {r.title}
                      {r.source_url ? (
                        <>
                          {" "}
                          —{" "}
                          <a className="text-emerald-700 underline" href={r.source_url}>
                            link
                          </a>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5">
              {!plan ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Formu doldurup <span className="font-medium text-slate-900">Planı oluştur</span>’a
                  bas.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                  {plan}
                </pre>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Bilgilendirme amaçlıdır. Gmail / Calendar / ödeme entegrasyonları bir sonraki aşamada
          Google Cloud & Stripe anahtarlarıyla genişletilir.
        </footer>
      </div>
    </div>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-700">{props.label}</span>
      {props.children}
    </label>
  );
}
