import { cn } from "@/lib/utils";
import { glassInteractive } from "@/lib/premium-ui";

type Dict = Record<string, string>;

function bullets(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

/** Illustrative bar heights (px) — columns ~500 / ~1k / ~1.5k chars. */
const STD_H_PX = [32, 48, 72] as const;
const PREM_H_PX = [36, 56, 84] as const;

export function PricingCreditUsageGuide({ d }: { d: Dict }) {
  const standardLines = bullets(d["pricing.usageGuide.standardBullets"]);
  const premiumLines = bullets(d["pricing.usageGuide.premiumBullets"]);
  const stdVals = ["~15", "~30", "~45"];
  const premVals = ["~25", "~50", "~75"];

  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm leading-relaxed text-slate-400">{d["pricing.usageGuide.intro"]}</p>

      <div
        className={cn(
          "rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 shadow-[0_8px_40px_rgba(16,185,129,0.08)]",
          "backdrop-blur-md"
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">
          {d["pricing.usageGuide.miniBadge"]}
        </p>
        <p className="mt-1 text-base font-semibold text-white">{d["pricing.usageGuide.miniTitle"]}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{d["pricing.usageGuide.miniDesc"]}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-200">{d["pricing.usageGuide.scaleSectionTitle"]}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={cn("rounded-2xl p-5", glassInteractive)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/85">
              {d["pricing.usageGuide.standardTitle"]}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
              {standardLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {d["pricing.usageGuide.chartCaption"]}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/[0.06] pt-3">
                {[d["pricing.usageGuide.colShort"], d["pricing.usageGuide.colMid"], d["pricing.usageGuide.colLong"]].map(
                  (label, i) => (
                    <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full max-w-[3.75rem] rounded-md bg-gradient-to-t from-violet-600/40 to-violet-400/25"
                        style={{ height: `${STD_H_PX[i]}px` }}
                        aria-hidden
                      />
                      <span className="text-[11px] font-semibold tabular-nums text-white">{stdVals[i]}</span>
                      <span className="text-center text-[10px] leading-tight text-slate-500">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className={cn("rounded-2xl p-5", glassInteractive)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/85">
              {d["pricing.usageGuide.premiumTitle"]}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
              {premiumLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400/80" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {d["pricing.usageGuide.chartCaption"]}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/[0.06] pt-3">
                {[d["pricing.usageGuide.colShort"], d["pricing.usageGuide.colMid"], d["pricing.usageGuide.colLong"]].map(
                  (label, i) => (
                    <div key={`p-${label}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full max-w-[3.75rem] rounded-md bg-gradient-to-t from-amber-700/35 to-amber-400/25"
                        style={{ height: `${PREM_H_PX[i]}px` }}
                        aria-hidden
                      />
                      <span className="text-[11px] font-semibold tabular-nums text-white">{premVals[i]}</span>
                      <span className="text-center text-[10px] leading-tight text-slate-500">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">{d["pricing.usageGuide.chartHint"]}</p>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">{d["pricing.usageGuide.footer"]}</p>
    </div>
  );
}
