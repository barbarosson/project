import { cookies } from "next/headers";
import type { Metadata } from "next";

import { FaqList } from "@/app/faq/faq-list";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { getFaqContent } from "@/i18n/faq-content";
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
  const faq = getFaqContent(locale);
  return pageMetadataForPath("/faq", `${faq.title} | isendai`, faq.metaDescription);
}

export default async function FaqPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const faq = getFaqContent(locale);
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="legal">
        <SitePageBackNav>{d["nav.backToHome"]}</SitePageBackNav>
        <SitePageTitleBlock title={faq.title} subtitle={faq.intro} />
        <FaqList items={faq.items} />
      </SitePageMain>
    </SitePageChrome>
  );
}
