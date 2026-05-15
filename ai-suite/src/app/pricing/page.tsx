import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { PricingHeroOverview } from "@/components/pricing-hero-overview";
import { PricingCreditUsageGuide } from "@/components/pricing-credit-usage-guide";
import {
  PricingMonthlyShop,
  PricingPaygoShop,
  PricingYearlyShop,
} from "@/components/pricing/pricing-shop-blocks";
import { pageMain } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";
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
  const isProd = process.env.NODE_ENV === "production";
  const devTopupSecretRequired = Boolean(process.env.DEV_TOPUP_SECRET?.trim());
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
      <PricingHeroOverview d={d} />

      <PricingMonthlyShop />
      <PricingYearlyShop />
      <PricingPaygoShop />

      <section id="how-credits-work" className="mt-10 scroll-mt-24">
        <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
          {d["pricing.usageGuide.sectionTitle"]}
        </h2>
        <PricingCreditUsageGuide d={d} />
      </section>

      <p className="mt-10 text-xs leading-relaxed text-slate-500">{d["pricing.sectionFootnote"]}</p>

      {!isProd ? (
        <section className={cn("mt-6 rounded-2xl p-6", glassInteractive)}>
          <h2 className={cn("text-sm font-semibold", textGradientHero)}>{d["pricing.dev.title"]}</h2>
          <p className="mt-2 text-sm text-slate-400">{d["pricing.dev.body"]}</p>
          <pre className="mt-3 overflow-auto rounded-xl border border-white/[0.08] bg-black/30 p-4 text-xs text-slate-300 backdrop-blur-md">
{`POST /api/dev/topup
Content-Type: application/json

{ "credits": 10 }`}
          </pre>
          {devTopupSecretRequired ? (
            <p className="mt-2 text-xs leading-relaxed text-amber-200/90">{d["pricing.dev.secretHint"]}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">{d["pricing.dev.disabled"]}</p>
        </section>
      ) : null}
    </main>
  );
}
