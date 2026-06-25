import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageSection,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { glassSurface, pageOutlineButton, pageSectionLabel, pageStatValue, premiumCta } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  if (!userId) {
    redirect("/login?next=%2Fhistory");
  }

  const authSnapshot = await readServerAuthSnapshot();
  const admin = createSupabaseAdminClient();

  const { data: ent } = await admin
    .schema("isendai")
    .from("entitlements")
    .select("credits_balance,plan_id,plan_status,current_period_end")
    .eq("owner_type", "user")
    .eq("owner_id", userId)
    .maybeSingle();

  const { data: requests } = await admin
    .schema("isendai")
    .from("requests")
    .select("id,tool_id,model_id,created_at,credits_charged")
    .eq("owner_type", "user")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content">
        <SitePageTitleBlock
          title={d["history.title"]}
          subtitle={d["history.subtitleUser"]}
          actions={
            <>
              <Link className={pageOutlineButton} href="/account">
                {d["nav.account"]}
              </Link>
              <Link className={premiumCta} href="/">
                {d["nav.backToHome"]}
              </Link>
            </>
          }
        />

        <SitePageSection className="mt-0">
          <h2 className={pageSectionLabel}>{d["usage.creditsHeading"]}</h2>
          <p className={pageStatValue}>{formatCreditsFromTenths(ent?.credits_balance ?? 0)}</p>
        </SitePageSection>

        <SitePageSection>
          <div className="flex items-center justify-between gap-3">
            <h2 className={pageSectionLabel}>{d["usage.requestsHeading"]}</h2>
            <span className="text-sm text-slate-300">{requests?.length ?? 0}</span>
          </div>

          {requests && requests.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {requests.map((r) => (
                <div key={r.id} className={cn("rounded-xl p-4 text-sm text-slate-200", glassSurface)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">{r.tool_id}</p>
                      <Link
                        className="text-sm font-medium text-violet-300 hover:text-violet-200"
                        href={`/request/${r.id}`}
                      >
                        {d["usage.open"]}
                      </Link>
                      <Link
                        className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                        href={`/?request=${encodeURIComponent(r.id)}`}
                      >
                        {d["usage.rerun"]}
                      </Link>
                    </div>
                    <p className="text-sm text-slate-300">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">
                    {d["usage.modelLabel"]}: {r.model_id}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {d["usage.chargedLine"].replace("{charged}", formatCreditsFromTenths(r.credits_charged))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
              {d["usage.emptyRequests"]}
            </p>
          )}
        </SitePageSection>
      </SitePageMain>
    </SitePageChrome>
  );
}
