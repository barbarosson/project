"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signInGoogle() {
    setLoading(true);
    setMessage(null);
    const supabase = createBrowserSupabase();
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/dashboard"
        : "/dashboard";
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Adventora.ai
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Giriş yap</h1>
        <p className="mt-2 text-sm text-slate-600">
          Seyahat profilin, kayıtlı rotaların ve RAG kaynakları hesabına bağlıdır.
        </p>
        <button
          type="button"
          onClick={signInGoogle}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Yönlendiriliyor…" : "Google ile devam et"}
        </button>
        {message && (
          <p className="mt-4 text-sm text-rose-600">{message}</p>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-emerald-700 underline-offset-2 hover:underline">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}
