import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DICTS } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageSection,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { CopyVersionButton } from "./copy-buttons";
import { formatCreditsFromTenths } from "@/lib/credits-units";
import { glassSurface, pageOutlineButton, pageSectionLabel, premiumCta } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

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

  const authSnapshot = await readServerAuthSnapshot();
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
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content">
        <SitePageTitleBlock
          title={d["request.pageTitle"]}
          meta={`${reqRow.tool_id} · ${reqRow.model_id}`}
          subtitle={d["request.timeCreditsLine"]
            .replace("{date}", dateStr)
            .replace("{charged}", formatCreditsFromTenths(reqRow.credits_charged))
            .replace("{max}", String(reqRow.max_versions))}
          actions={
            <>
              <Link className={pageOutlineButton} href="/account">
                {d["nav.account"]}
              </Link>
              <Link className={pageOutlineButton} href={`/?request=${encodeURIComponent(id)}`}>
                {d["usage.rerun"]}
              </Link>
              <Link className={premiumCta} href="/">
                {d["nav.backToHome"]}
              </Link>
            </>
          }
        />

        <SitePageSection className="mt-0">
          <h2 className={pageSectionLabel}>{d["request.inputStored"]}</h2>
          <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/35 p-4 text-sm leading-relaxed text-slate-200 backdrop-blur-md sm:text-base">
            {JSON.stringify(reqRow.input_json, null, 2)}
          </pre>
        </SitePageSection>

        <SitePageSection>
          <h2 className={pageSectionLabel}>{d["request.versions"]}</h2>
          {versions && versions.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {versions.map((v) => (
                <div key={v.idx} className={cn("rounded-xl p-4", glassSurface)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-200">
                      {d["request.versionLine"].replace("{idx}", String(v.idx))}
                    </p>
                    <div className="flex items-center gap-2">
                      <CopyVersionButton text={v.text} />
                      <p className="text-sm text-slate-300">{new Date(v.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100 sm:text-base">
                    {v.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
              {d["request.noVersions"]}
            </p>
          )}
        </SitePageSection>
      </SitePageMain>
    </SitePageChrome>
  );
}
