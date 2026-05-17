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
import { pageMain } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import { premiumCta, textGradientHero } from "@/lib/premium-ui";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale) as Locale;
  const d = DICTS[locale];
  return {
    title: `${d["pricing.title"]} | isendai`,
    description: d["pricing.subtitle"],
  };
}

export default async function PricingPage() {
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  return (
    <main className={pageMain("content")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1
          className={cn(
            "min-w-0 flex-1 text-2xl font-semibold tracking-tight sm:text-3xl",
            textGradientHero
          )}
        >
          {d["pricing.title"]}
        </h1>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link className={premiumCta} href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{d["pricing.subtitle"]}</p>
      <p className="mt-2 text-sm font-medium text-violet-200/90">{d["pricing.allPaygoPacks"]}</p>
      <PricingHeroOverview d={d} />

      <PricingMonthlyShop />
      <PricingYearlyShop />
      <PricingPaygoShop />

      <PricingModelClassNote d={d} />

      <section id="how-credits-work" className="mt-10 scroll-mt-24">
        <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
          {d["pricing.usageGuide.sectionTitle"]}
        </h2>
        <PricingCreditUsageGuide d={d} />
      </section>
    </main>
  );
}
