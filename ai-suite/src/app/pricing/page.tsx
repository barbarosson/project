import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { PricingHeroOverview } from "@/components/pricing-hero-overview";
import { PricingCreditUsageGuide } from "@/components/pricing-credit-usage-guide";
import { PricingPaygoTierCards } from "@/components/pricing-paygo-tier-cards";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
import { cn } from "@/lib/utils";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";
import { DICTS, type Locale } from "@/i18n/dictionaries";
import { resolveLocaleFromCookie } from "@/i18n/resolve-locale";

export const dynamic = "force-dynamic";

const PAYGO_TIERS = ["budget", "standard", "premium"] as const;
const MONTHLY_PLANS = ["starter", "growth", "scale"] as const;

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
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
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
          <SiteLocaleToolbar />
          <Link className={premiumCta} href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>
      <PricingHeroOverview d={d} />

      <section className="mt-10">
        <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
          {d["pricing.monthly.sectionTitle"]}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{d["pricing.monthly.sectionLead"]}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MONTHLY_PLANS.map((plan) => (
            <div key={plan} className={cn("rounded-2xl p-6", glassInteractive)}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {d[`pricing.monthly.${plan}.name`]}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {d[`pricing.monthly.${plan}.price`]}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
                {d[`pricing.monthly.${plan}.credits`]}
              </p>
              <p className="mt-3 text-sm text-slate-400">{d[`pricing.monthly.${plan}.desc`]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
          {d["pricing.yearly.sectionTitle"]}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{d["pricing.yearly.sectionLead"]}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MONTHLY_PLANS.map((plan) => (
            <div
              key={`yearly-${plan}`}
              className={cn(
                "rounded-2xl border border-violet-500/30 p-6 shadow-2xl backdrop-blur-xl",
                "bg-white/[0.03] transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)]"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {d[`pricing.monthly.${plan}.name`]}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {d[`pricing.yearly.${plan}.price`]}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
                {d[`pricing.yearly.${plan}.credits`]}
              </p>
              <p className="mt-3 text-sm text-slate-400">{d[`pricing.yearly.${plan}.desc`]}</p>
              <p className="mt-3 text-xs font-medium text-emerald-400/90">{d[`pricing.yearly.${plan}.savings`]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
          {d["pricing.paygo.sectionTitle"]}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{d["pricing.paygo.sectionLead"]}</p>
        <PricingPaygoTierCards
          tiers={PAYGO_TIERS.map((tier) => ({
            id: tier,
            label: d[`pricing.tier.${tier}`],
            price: d[`pricing.tier.${tier}Price`],
            pack: d[`pricing.pack.${tier}`],
            summary: d[`pricing.tier.${tier}Summary`],
            detail: d[`pricing.tier.${tier}Desc`],
          }))}
          detailModalTitle={d["pricing.paygo.detailModalTitle"]}
          infoButtonAria={d["pricing.paygo.infoButtonAria"]}
          closeLabel={d["pricing.paygo.closeDetails"]}
        />
      </section>

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
