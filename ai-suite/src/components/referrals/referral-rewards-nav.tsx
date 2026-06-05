"use client";

import Link from "next/link";

import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function ReferralRewardsNav({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <Link
      href="/free-credits"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-fuchsia-100 backdrop-blur-xl transition-colors hover:border-fuchsia-400/50 hover:bg-fuchsia-500/20 sm:gap-1 sm:px-3 sm:py-1 sm:text-sm",
        className
      )}
    >
      <span aria-hidden>🎁</span>
      <span className="hidden sm:inline">{t("referrals.navLabel")}</span>
      <span className="sm:hidden">{t("referrals.navLabelShort")}</span>
    </Link>
  );
}
