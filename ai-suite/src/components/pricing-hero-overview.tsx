import { CalendarDays, Percent, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import { glassSurface } from "@/lib/premium-ui";

type Dict = Record<string, string>;

const MONTHLY_PLANS = ["starter", "growth", "scale"] as const;
const PAYGO_TIERS = ["budget", "standard", "premium"] as const;

type Props = {
  d: Dict;
};

export function PricingHeroOverview({ d }: Props) {
  return (
    <div
      className={cn(
        "mt-4 w-full min-w-0 rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.07] to-transparent p-4 sm:p-5",
        "shadow-[0_12px_48px_rgba(88,28,135,0.12)]"
      )}
    >
      <p className="text-sm font-medium text-slate-200">{d["pricing.hero.intro"]}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {/* Monthly */}
        <div className={cn("flex flex-col rounded-xl p-4", glassSurface)}>
          <div className="flex items-center gap-2 text-violet-200/95">
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">{d["pricing.hero.tagMonthly"]}</span>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
            {MONTHLY_PLANS.map((plan) => (
              <li key={plan} className="flex flex-col gap-0.5 border-b border-white/[0.06] pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {d[`pricing.monthly.${plan}.name`]}
                </span>
                <span className="tabular-nums text-slate-200">
                  <span className="text-slate-400">{d[`pricing.monthly.${plan}.credits`]}</span>
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="font-semibold text-white">{d[`pricing.monthly.${plan}.price`]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Annual */}
        <div className={cn("relative flex flex-col rounded-xl p-4", glassSurface)}>
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/95">
            {d["pricing.hero.annualSaveBadge"]}
          </span>
          <div className="flex items-center gap-2 pr-14 text-violet-200/95 sm:pr-16">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
              <Percent className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 text-xs font-semibold uppercase tracking-wide">{d["pricing.hero.tagAnnual"]}</span>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
            {MONTHLY_PLANS.map((plan) => (
              <li key={`y-${plan}`} className="flex flex-col gap-0.5 border-b border-white/[0.06] pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {d[`pricing.monthly.${plan}.name`]}
                </span>
                <span className="tabular-nums text-slate-200">
                  <span className="text-slate-400">{d[`pricing.yearly.${plan}.credits`]}</span>
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="font-semibold text-white">{d[`pricing.yearly.${plan}.price`]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* PAYGO */}
        <div className={cn("flex flex-col rounded-xl p-4", glassSurface)}>
          <div className="flex items-center gap-2 text-violet-200/95 light:text-violet-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-200 light:bg-amber-100 light:text-amber-900">
              <WalletCards className="size-4" aria-hidden />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">{d["pricing.hero.tagPaygo"]}</span>
          </div>
          <ul className="mt-3 space-y-2">
            {PAYGO_TIERS.map((tier) => (
              <li
                key={tier}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2 text-sm text-slate-200"
              >
                <span className="text-[11px] font-medium text-slate-500">{d[`pricing.tier.${tier}`]}</span>
                <span className="text-right text-xs font-medium tabular-nums text-violet-200/95">{d[`pricing.pack.${tier}`]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-snug text-slate-500">{d["pricing.hero.paygoHint"]}</p>
        </div>
      </div>

      <p className="mt-4 border-t border-white/[0.08] pt-4 text-sm leading-relaxed text-slate-400">
        {d["pricing.hero.footerMain"]}{" "}
        <a
          href="#how-credits-work"
          className="font-medium text-violet-300 underline decoration-violet-500/40 underline-offset-2 transition-colors hover:text-violet-200 hover:decoration-violet-400/60"
        >
          {d["pricing.hero.footerJump"]}
        </a>
      </p>
    </div>
  );
}
