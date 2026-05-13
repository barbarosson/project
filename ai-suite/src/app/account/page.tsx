import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthStatus } from "@/components/auth-status";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { cn } from "@/lib/utils";
import { glassInteractive, glassSurface, premiumCta, textGradientHero } from "@/lib/premium-ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login?next=%2Faccount");

  const { data: ent } = await supabase
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance,max_versions_per_request,plan_id,plan_status,current_period_end")
    .eq("owner_type", "user")
    .eq("owner_id", user.id)
    .maybeSingle();

  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const { data: requests } = await supabase
    .schema("isendai")
    .from("requests")
    .select("id,tool_id,model_id,created_at,credits_charged,max_versions")
    .eq("owner_type", "user")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", textGradientHero)}>
            {d["account.pageTitle"]}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SiteLocaleToolbar />
          <AuthStatus omitAccountLink />
          <Link
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
            href="/account/profile"
          >
            {d["profile.editLink"]}
          </Link>
          <Link
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl transition-all hover:border-violet-500/35 hover:bg-white/[0.07]"
            href="/claim"
          >
            {d["account.linkGuest"]}
          </Link>
          <Link className={premiumCta} href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>

      <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
        <h2 className={cn("text-sm font-semibold", textGradientHero)}>{d["usage.creditsHeading"]}</h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {ent?.credits_balance ?? 0}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {d["usage.versionsLine"].replace("{max}", String(ent?.max_versions_per_request ?? 5))}
        </p>
      </section>

      <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={cn("text-sm font-semibold", textGradientHero)}>{d["account.recentRequests"]}</h2>
          <span className="text-xs text-slate-400">{requests?.length ?? 0}</span>
        </div>

        {requests && requests.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {requests.map((r) => (
              <div key={r.id} className={cn("rounded-xl p-4 text-sm text-slate-300", glassSurface)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">{r.tool_id}</p>
                    <Link className="text-xs text-violet-300 hover:text-violet-200" href={`/request/${r.id}`}>
                      {d["usage.open"]}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {d["usage.modelLabel"]}: {r.model_id}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {d["usage.chargedLine"]
                    .replace("{charged}", String(r.credits_charged))
                    .replace("{max}", String(r.max_versions))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">{d["usage.emptyRequests"]}</p>
        )}
      </section>
    </main>
  );
}

