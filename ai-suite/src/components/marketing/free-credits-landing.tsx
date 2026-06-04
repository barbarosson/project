"use client";

import Link from "next/link";
import { Gift, Users } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { REFERRAL_BONUS_CREDITS_WHOLE } from "@/lib/referrals/constants";
import { WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE } from "@/lib/welcome-bonus/constants";
import {
  glassSurface,
  marketingLink,
  pageOutlineButton,
  premiumCta,
  sectionGradientHeading,
} from "@/lib/premium-ui";
import { cn } from "@/lib/utils";

export function FreeCreditsLanding() {
  const { t } = useI18n();
  const welcomeCredits = String(WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE);
  const referralCredits = String(REFERRAL_BONUS_CREDITS_WHOLE);

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-emerald-400/35 px-5 py-5 sm:px-6",
          "bg-gradient-to-br from-emerald-500/15 via-violet-500/10 to-transparent",
          "light:border-emerald-500/40 light:from-emerald-100/80 light:via-violet-50/60",
          glassSurface
        )}
        aria-labelledby="free-credits-welcome-heading"
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
            <h2
              id="free-credits-welcome-heading"
              className="text-xs font-bold uppercase tracking-wider text-emerald-200 light:text-emerald-800"
            >
              {t("home.welcomeBonus.kicker")}
            </h2>
            <p className="mt-1 text-base font-bold leading-snug text-white light:text-slate-900 sm:text-lg">
              {t("home.welcomeBonus.title").replace("{credits}", welcomeCredits)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 light:text-slate-700">
              {t("home.welcomeBonus.body").replace("{credits}", welcomeCredits)}
            </p>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
              {t("home.welcomeBonus.hint")}
            </p>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-fuchsia-400/35 px-5 py-5 sm:px-6",
          "bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-transparent",
          "light:border-fuchsia-500/40 light:from-fuchsia-100/70 light:via-violet-50/60",
          glassSurface
        )}
        aria-labelledby="free-credits-referral-heading"
      >
        <div className="relative flex gap-3 sm:gap-4">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/25 text-fuchsia-100 light:bg-fuchsia-500/15 light:text-fuchsia-800"
            aria-hidden
          >
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="free-credits-referral-heading"
              className={cn(sectionGradientHeading, "text-base sm:text-lg")}
            >
              {t("freeCredits.referralSectionTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 light:text-slate-700">
              {t("referrals.pageLead").replace("{n}", referralCredits)}
            </p>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
              {t("referrals.statsHint")}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/login?next=%2Ffree-credits" className={premiumCta}>
          {t("freeCredits.ctaSignUp")}
        </Link>
        <Link href="/login" className={pageOutlineButton}>
          {t("nav.login")}
        </Link>
        <Link href="/faq" className={cn(marketingLink, "text-sm font-semibold")}>
          {t("nav.faq")}
        </Link>
      </div>
    </div>
  );
}
