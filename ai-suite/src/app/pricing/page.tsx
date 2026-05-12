import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import { CustomMonthlyPack } from "@/app/pricing/custom-monthly-pack";
import { SiteLocaleToolbar } from "@/components/site-locale-toolbar";
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
  const cookieLocale = (await cookies()).get("ai-suite-locale")?.value;
  const locale = resolveLocaleFromCookie(cookieLocale);
  const d = DICTS[locale];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{d["pricing.title"]}</h1>
          <p className="mt-2 text-sm text-slate-300">{d["pricing.subtitle"]}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <SiteLocaleToolbar />
          <Link className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/">
            {d["nav.backToHome"]}
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-white">{d["pricing.monthly.sectionTitle"]}</h2>
        <p className="mt-2 text-sm text-slate-300">{d["pricing.monthly.sectionLead"]}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MONTHLY_PLANS.map((plan) => (
            <div
              key={plan}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {d[`pricing.monthly.${plan}.name`]}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {d[`pricing.monthly.${plan}.price`]}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
                {d[`pricing.monthly.${plan}.requests`]}
              </p>
              <p className="mt-3 text-sm text-slate-300">{d[`pricing.monthly.${plan}.desc`]}</p>
            </div>
          ))}
        </div>
      </section>

      <CustomMonthlyPack className="mt-10" />

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-white">{d["pricing.paygo.sectionTitle"]}</h2>
        <p className="mt-2 text-sm text-slate-300">{d["pricing.paygo.sectionLead"]}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PAYGO_TIERS.map((tier) => (
            <div
              key={tier}
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md"
            >
              <p className="text-xs font-semibold text-slate-300">{d[`pricing.tier.${tier}`]}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {d[`pricing.tier.${tier}Price`]}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
                {d["pricing.pack.requests"]}
              </p>
              <p className="mt-3 text-sm text-slate-300">{d[`pricing.tier.${tier}Desc`]}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">{d["pricing.sectionFootnote"]}</p>

      {!isProd ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-sm font-semibold text-white">{d["pricing.dev.title"]}</h2>
          <p className="mt-2 text-sm text-slate-300">{d["pricing.dev.body"]}</p>
          <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-200">
{`POST /api/dev/topup
Content-Type: application/json

{ "credits": 10 }`}
          </pre>
          <p className="mt-2 text-xs text-slate-400">{d["pricing.dev.disabled"]}</p>
        </section>
      ) : null}
    </main>
  );
}
