import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId } from "@/lib/isendai/owner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { CopyVersionButton } from "./copy-buttons";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  const ownerType: "user" | "anon" = userId ? "user" : "anon";
  const ownerId = userId ?? (await getOrCreateAnonId());

  const admin = createSupabaseAdminClient();
  const { data: reqRow } = await admin
    .schema("isendai")
    .from("requests")
    .select("id,owner_type,owner_id,tool_id,model_id,created_at,credits_charged,max_versions,input_json")
    .eq("id", id)
    .maybeSingle();

  if (!reqRow) notFound();
  if (reqRow.owner_type !== ownerType || reqRow.owner_id !== ownerId) notFound();

  const { data: versions } = await admin
    .schema("isendai")
    .from("request_versions")
    .select("idx,text,created_at")
    .eq("request_id", id)
    .order("idx", { ascending: true });

  const dateStr = new Date(reqRow.created_at).toLocaleString();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{d["request.pageTitle"]}</h1>
          <p className="mt-1 text-sm text-slate-300">
            {reqRow.tool_id} · {reqRow.model_id}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {d["request.timeCreditsLine"]
              .replace("{date}", dateStr)
              .replace("{charged}", String(reqRow.credits_charged))
              .replace("{max}", String(reqRow.max_versions))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md border border-white/10 bg-slate-900/40 px-4 py-2 text-sm text-slate-200"
            href="/account"
          >
            {d["nav.account"]}
          </Link>
          <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-sm font-semibold text-white">{d["request.inputStored"]}</h2>
        <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-200">
          {JSON.stringify(reqRow.input_json, null, 2)}
        </pre>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-sm font-semibold text-white">{d["request.versions"]}</h2>
        {versions && versions.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {versions.map((v) => (
              <div key={v.idx} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-300">
                    {d["request.versionLine"].replace("{idx}", String(v.idx))}
                  </p>
                  <div className="flex items-center gap-2">
                    <CopyVersionButton text={v.text} />
                    <p className="text-xs text-slate-500">{new Date(v.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{v.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">{d["request.noVersions"]}</p>
        )}
      </section>
    </main>
  );
}
