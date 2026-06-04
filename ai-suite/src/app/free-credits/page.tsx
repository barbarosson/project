import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FreeCreditsLanding } from "@/components/marketing/free-credits-landing";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import { pageMetadataForPath } from "@/lib/site-metadata";
import {
  SitePageBackNav,
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageTitleBlock,
} from "@/components/site-page-layout";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return pageMetadataForPath(
    "/free-credits",
    `${d["freeCredits.pageTitle"]} | isendai`,
    d["freeCredits.metaDescription"],
    locale
  );
}

export default async function FreeCreditsPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  const authSnapshot = await readServerAuthSnapshot();
  if (authSnapshot.signedIn) {
    redirect("/dashboard/rewards");
  }

  return (
    <SitePageChrome>
      <SitePageHeader />
      <SitePageMain width="narrow">
        <SitePageBackNav>{d["nav.backToHome"]}</SitePageBackNav>
        <SitePageTitleBlock
          title={d["freeCredits.pageTitle"]}
          subtitle={d["freeCredits.pageLead"]}
        />
        <FreeCreditsLanding />
      </SitePageMain>
    </SitePageChrome>
  );
}
