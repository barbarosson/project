"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [travelStyle, setTravelStyle] = useState("culture");
  const [homeCity, setHomeCity] = useState("");
  const [pace, setPace] = useState("balanced");
  const [dietary, setDietary] = useState("");
  const [interests, setInterests] = useState("müze, doğa, gastronomi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const prefs = {
        travelStyle,
        pace,
        dietaryNotes: dietary,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travel_style: travelStyle,
          home_city: homeCity || null,
          pace,
          dietary_notes: dietary || null,
          interests: prefs.interests,
          preferences: prefs,
          onboarding_completed: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      router.replace("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Profilini tamamla</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bu bilgiler AI planında varsayılan tercih olarak kullanılır (RAG + profil bağlamı).
        </p>
        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Yaşadığın şehir</span>
            <input
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="İstanbul"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Seyahat stili</span>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="budget">Bütçe dostu</option>
              <option value="comfort">Konfor</option>
              <option value="luxury">Lüks</option>
              <option value="family">Aile</option>
              <option value="adventure">Macera</option>
              <option value="culture">Kültür</option>
              <option value="food">Gastronomi</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Tempo</span>
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="relaxed">Rahat</option>
              <option value="balanced">Dengeli</option>
              <option value="packed">Yoğun</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Beslenme / kısıtlar</span>
            <input
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="vegan, glutensiz…"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">İlgi alanları (virgülle)</span>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor…" : "Kaydet ve devam et"}
          </button>
        </div>
      </div>
    </div>
  );
}
