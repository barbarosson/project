import { cookies } from "next/headers";
import type { Metadata } from "next";

import { InstallGuide } from "@/app/install/install-guide";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { getInstallGuideContent } from "@/i18n/install-guide-content";
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
  const guide = getInstallGuideContent(locale);
  return pageMetadataForPath("/install", `${guide.title} | isendai`, guide.metaDescription, locale);
}

export default async function InstallPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  const guide = getInstallGuideContent(locale);
  const authSnapshot = await readServerAuthSnapshot();

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content">
        <SitePageBackNav>{d["nav.backToHome"]}</SitePageBackNav>
        <SitePageTitleBlock title={guide.title} subtitle={guide.intro} />
        <InstallGuide content={guide} />
      </SitePageMain>
    </SitePageChrome>
  );
}
