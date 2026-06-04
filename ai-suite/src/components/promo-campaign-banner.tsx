"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Percent, Check } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import { PROMO_CODE_ISEND101, PROMO_ISEND101_DISCOUNT_PERCENT } from "@/lib/promo";
import { cn } from "@/lib/utils";
import { glassSurface, interactiveClick } from "@/lib/premium-ui";

type Props = {
  className?: string;
  /** Show link to /pricing on home hero */
  showPricingLink?: boolean;
};

export function PromoCampaignBanner({ className, showPricingLink = false }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE_ISEND101);
      setCopied(true);
      toast.success(t("promo.isend101.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("promo.isend101.copyFailed"));
    }
  }

  const body = t("promo.isend101.body")
    .replace("{code}", PROMO_CODE_ISEND101)
    .replace("{percent}", String(PROMO_ISEND101_DISCOUNT_PERCENT));

  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/12 via-violet-500/10 to-fuchsia-500/10 p-4 sm:p-5",
        "shadow-[0_8px_32px_rgba(251,191,36,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        "light:border-amber-500/50 light:from-amber-50/95 light:via-violet-50/70 light:to-fuchsia-50/50",
        "light:shadow-[0_8px_28px_rgba(180,120,20,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)]",
        className
      )}
      aria-label={t("promo.isend101.ariaLabel")}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-amber-400/10 blur-2xl light:bg-amber-300/25"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start gap-3 sm:gap-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-200",
            "light:border-amber-600/35 light:bg-amber-100 light:text-amber-900"
          )}
          aria-hidden
        >
          <Percent className="size-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest text-amber-200/95 sm:text-sm",
              "light:text-amber-900"
            )}
          >
            {t("promo.isend101.badge")}
          </p>
          <p
            className={cn(
              "mt-1 text-base font-bold leading-snug text-white sm:text-lg",
              "light:text-slate-900"
            )}
          >
            {t("promo.isend101.title")}
          </p>
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed text-slate-200 sm:text-base",
              "light:text-slate-800"
            )}
          >
            {body}
          </p>
          <p
            className={cn(
              "mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm",
              "light:text-slate-600"
            )}
          >
            {t("promo.isend101.hint")}
          </p>
          {showPricingLink ? (
            <p className="mt-3">
              <Link
                href="/pricing"
                className={cn(
                  "text-sm font-semibold text-violet-300 underline-offset-2 hover:text-violet-200 hover:underline",
                  "light:text-violet-800 light:hover:text-violet-950"
                )}
              >
                {t("promo.isend101.viewPricing")} →
              </Link>
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex shrink-0 flex-col items-stretch gap-2 sm:items-end",
            glassSurface,
            "rounded-xl p-2.5 light:border-amber-400/40 light:bg-white/90"
          )}
        >
          <span
            className={cn(
              "text-center text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs",
              "light:text-slate-600"
            )}
          >
            {t("promo.isend101.codeLabel")}
          </span>
          <code
            className={cn(
              "text-center font-mono text-lg font-bold tracking-wider text-amber-100 sm:text-xl",
              "light:text-amber-950"
            )}
          >
            {PROMO_CODE_ISEND101}
          </code>
          <button
            type="button"
            onClick={() => void copyCode()}
            className={cn(
              interactiveClick,
              "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/40 hover:bg-amber-500/10 sm:text-sm",
              "light:border-slate-300/80 light:bg-white light:text-slate-800 light:hover:border-amber-500/50 light:hover:bg-amber-50"
            )}
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {copied ? t("promo.isend101.copiedShort") : t("promo.isend101.copy")}
          </button>
        </div>
      </div>
    </aside>
  );
}
