"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import {
  CUSTOM_MIX_RATE_USD,
  estimateCustomMonthlyUsd,
  formatUsd,
} from "@/lib/pricing-rates";
import { cn } from "@/lib/utils";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  tr: "tr-TR",
};

export function CustomMonthlyPack({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const [low, setLow] = React.useState(0);
  const [mid, setMid] = React.useState(0);
  const [high, setHigh] = React.useState(0);

  const total = estimateCustomMonthlyUsd(low, mid, high);
  const nfLocale = LOCALE_MAP[locale] ?? "en-US";

  function parseNonNegInt(raw: string): number {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, 1_000_000);
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-white">{t("pricing.custom.title")}</h2>
      <p className="mt-2 text-sm text-slate-300">{t("pricing.custom.subtitle")}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("pricing.custom.lowLabel")}
          </span>
          <Input
            inputMode="numeric"
            type="number"
            min={0}
            value={low || ""}
            onChange={(e) => setLow(parseNonNegInt(e.target.value))}
            className="border-white/15 bg-slate-950/50"
          />
          <span className="text-[11px] leading-snug text-slate-500">
            {t("pricing.custom.lowRateHint").replace(
              "{rate}",
              formatUsd(CUSTOM_MIX_RATE_USD.low, nfLocale)
            )}
          </span>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("pricing.custom.midLabel")}
          </span>
          <Input
            inputMode="numeric"
            type="number"
            min={0}
            value={mid || ""}
            onChange={(e) => setMid(parseNonNegInt(e.target.value))}
            className="border-white/15 bg-slate-950/50"
          />
          <span className="text-[11px] leading-snug text-slate-500">
            {t("pricing.custom.midRateHint").replace(
              "{rate}",
              formatUsd(CUSTOM_MIX_RATE_USD.mid, nfLocale)
            )}
          </span>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("pricing.custom.highLabel")}
          </span>
          <Input
            inputMode="numeric"
            type="number"
            min={0}
            value={high || ""}
            onChange={(e) => setHigh(parseNonNegInt(e.target.value))}
            className="border-white/15 bg-slate-950/50"
          />
          <span className="text-[11px] leading-snug text-slate-500">
            {t("pricing.custom.highRateHint").replace(
              "{rate}",
              formatUsd(CUSTOM_MIX_RATE_USD.high, nfLocale)
            )}
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">
            {t("pricing.custom.totalLabel")}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{formatUsd(total, nfLocale)}</p>
        </div>
        <p className="max-w-xl text-[11px] leading-relaxed text-slate-500">{t("pricing.custom.disclaimer")}</p>
      </div>
    </div>
  );
}
