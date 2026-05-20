import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { PricingHeroOverview } from "@/components/pricing-hero-overview";
import { PricingCreditUsageGuide } from "@/components/pricing-credit-usage-guide";
import { PricingModelClassNote } from "@/components/pricing-model-class-note";
import {
  PricingMonthlyShop,
  PricingPaygoShop,
  PricingYearlyShop,
} from "@/components/pricing/pricing-shop-blocks";
import { readServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";
import {
  SitePageChrome,
  SitePageHeader,
  SitePageMain,
  SitePageTitleBlock,
} from "@/components/site-page-layout";
import { LemonStatusBanner } from "@/components/billing/lemon-status-banner";
import { PromoCampaignBanner } from "@/components/promo-campaign-banner";
import { lemonStatusBannerMessage } from "@/lib/billing/lemon-banner-key";
import { premiumCta, pageSectionLabel, pageSubtitle } from "@/lib/premium-ui";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";
import { cn } from "@/lib/utils";
import { pageMetadataForPath } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return pageMetadataForPath("/pricing", `${d["pricing.title"]} | isendai`, d["pricing.subtitle"]);
}

export default async function PricingPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];
  const authSnapshot = await readServerAuthSnapshot();
  const lemonBanner = lemonStatusBannerMessage(locale);

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="content">
        <SitePageTitleBlock
          title={d["pricing.title"]}
          actions={<Link className={premiumCta} href="/">{d["nav.backToHome"]}</Link>}
        />
        <p className={cn(pageSubtitle, "max-w-3xl")}>{d["pricing.subtitle"]}</p>
        {lemonBanner ? <LemonStatusBanner message={lemonBanner} className="mt-4" /> : null}
        <PromoCampaignBanner className="mt-6" />
        <p className={cn("mt-4", "text-sm font-medium text-violet-200/90 sm:text-base")}>
          {d["pricing.allPaygoPacks"]}
        </p>
        <PricingHeroOverview d={d} />

        <PricingMonthlyShop />
        <PricingYearlyShop />
        <PricingPaygoShop />

        <PricingModelClassNote d={d} />

        <section id="how-credits-work" className="mt-10 scroll-mt-24">
          <h2 className={pageSectionLabel}>{d["pricing.usageGuide.sectionTitle"]}</h2>
          <PricingCreditUsageGuide d={d} />
        </section>
      </SitePageMain>
    </SitePageChrome>
  );
}
