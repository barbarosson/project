import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageSection,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { glassSurface, pageOutlineButton, pageSectionLabel, pageStatValue, premiumCta } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login?next=%2Faccount");

  const authSnapshot = await readServerAuthSnapshot();

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
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content">
        <SitePageTitleBlock
          title={d["account.pageTitle"]}
          meta={user.email}
          actions={
            <>
              <SiteLocaleToolbar />
              <Link className={pageOutlineButton} href="/account/profile">
                {d["profile.editLink"]}
              </Link>
              <Link className={pageOutlineButton} href="/history">
                {d["nav.history"]}
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
          <p className={cn("mt-2", "text-sm leading-relaxed text-slate-200 sm:text-base")}>
            {d["usage.versionsLine"].replace("{max}", String(ent?.max_versions_per_request ?? 5))}
          </p>
        </SitePageSection>

        <SitePageSection>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={pageSectionLabel}>{d["account.recentRequests"]}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">{requests?.length ?? 0}</span>
              <Link
                className="text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
                href="/history"
              >
                {d["nav.history"]} →
              </Link>
            </div>
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
                    </div>
                    <p className="text-sm text-slate-300">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">
                    {d["usage.modelLabel"]}: {r.model_id}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {d["usage.chargedLine"]
                      .replace("{charged}", formatCreditsFromTenths(r.credits_charged))
                      .replace("{max}", String(r.max_versions))}
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
