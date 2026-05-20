import { cookies } from "next/headers";
import type { Metadata } from "next";

import { TermsBody } from "@/app/legal/terms-body";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import {
  SitePageBackNav,
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { pageSubtitle } from "@/lib/premium-ui";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { pageMetadataForPath } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return pageMetadataForPath(
    "/terms",
    `${d["legal.termsTitle"]} | isendai`,
    d["legal.termsMetaDescription"],
    locale
  );
}

export default async function TermsPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const year = String(new Date().getFullYear());
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="legal">
        <SitePageBackNav>{d["nav.backToHome"]}</SitePageBackNav>
        <SitePageTitleBlock title={d["legal.termsTitle"]} />
        <p className={cn(pageSubtitle, "mt-2")}>
          {d["legal.effective"].replace("{year}", year)}
        </p>
        <p className={cn(pageSubtitle, "mt-2")}>{d["legal.paymentsStub"]}</p>
        <div className="legal-document mt-8">
          <TermsBody locale={locale} />
        </div>
      </SitePageMain>
    </SitePageChrome>
  );
}
