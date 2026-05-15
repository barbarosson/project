import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { CopyVersionButton } from "./copy-buttons";
import { pageMain } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, premiumCta, textGradientHero } from "@/lib/premium-ui";

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
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/request/${id}`)}`);
  }
  const ownerType = "user" as const;
  const ownerId = userId;

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
    <main className={pageMain("content")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
            {d["request.pageTitle"]}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
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
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
            href="/account"
          >
            {d["nav.account"]}
          </Link>
          <Link className={premiumCta} href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>

      <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
        <h2 className={cn("text-sm font-semibold", textGradientHero)}>{d["request.inputStored"]}</h2>
        <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/35 p-4 text-xs text-slate-300 backdrop-blur-md">
          {JSON.stringify(reqRow.input_json, null, 2)}
        </pre>
      </section>

      <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
        <h2 className={cn("text-sm font-semibold", textGradientHero)}>{d["request.versions"]}</h2>
        {versions && versions.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {versions.map((v) => (
              <div key={v.idx} className={cn("rounded-xl p-4", glassSurface)}>
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
