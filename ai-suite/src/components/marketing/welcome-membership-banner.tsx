"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE } from "@/lib/welcome-bonus/constants";
import { glassSurface, marketingLink } from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function WelcomeMembershipBanner({ className }: Props) {
  const { t } = useI18n();
  const credits = String(WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-400/35 px-5 py-4 sm:px-6",
        "bg-gradient-to-br from-emerald-500/15 via-violet-500/10 to-transparent",
        "light:border-emerald-500/40 light:from-emerald-100/80 light:via-violet-50/60",
        glassSurface,
        className
      )}
      role="note"
      aria-label={t("home.welcomeBonus.ariaLabel")}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-emerald-400/20 blur-2xl light:bg-emerald-300/30"
        aria-hidden
      />
      <div className="relative flex gap-3 sm:gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-100 light:bg-emerald-500/15 light:text-emerald-800"
          aria-hidden
        >
          <Gift className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 light:text-emerald-800">
            {t("home.welcomeBonus.kicker")}
          </p>
          <p className="mt-1 text-base font-bold leading-snug text-white light:text-slate-900">
            {t("home.welcomeBonus.title").replace("{credits}", credits)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200 light:text-slate-700">
            {t("home.welcomeBonus.body").replace("{credits}", credits)}
          </p>
          <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
            {t("home.welcomeBonus.hint")}
          </p>
          <Link href="/login" className={cn(marketingLink, "mt-3 inline-flex text-sm font-semibold")}>
            {t("home.welcomeBonus.cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
