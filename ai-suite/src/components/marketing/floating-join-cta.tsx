"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { interactiveClick } from "@/lib/premium-ui";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

type Props = {
  /** When false (signed-in users), the button is not rendered. */
  visible: boolean;
  /** Hide on compact shell (< lg); bottom nav replaces join CTA on phone/tablet. */
  hideOnCompact?: boolean;
};

export function FloatingJoinCta({ visible, hideOnCompact = true }: Props) {
  const { t } = useI18n();
  const mounted = useIsClient();

  if (!visible || !mounted) return null;

  return createPortal(
    <Link
      href="/login"
      className={cn(
        interactiveClick,
        "fixed z-[65] inline-flex items-center gap-1.5 rounded-full border shadow-lg backdrop-blur-xl",
        "border-violet-400/35 bg-slate-950/45 font-bold text-white",
        "hover:border-violet-400/55 hover:bg-slate-950/60 hover:shadow-[0_6px_24px_rgba(124,58,237,0.28)]",
        "light:border-violet-300/55 light:bg-white/72 light:text-violet-950 light:shadow-[0_4px_18px_rgba(30,58,138,0.14)]",
        "light:hover:border-violet-400/65 light:hover:bg-white/85",
        hideOnCompact && "hidden lg:inline-flex",
        "max-md:bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        "max-md:left-[max(0.75rem,env(safe-area-inset-left,0px))]",
        "max-md:h-10 max-md:max-w-[10.75rem] max-md:px-2.5 max-md:py-1.5 max-md:text-xs",
        "max-md:shadow-[0_4px_20px_rgba(0,0,0,0.22)]",
        "md:bottom-8 md:left-10 md:h-11 md:max-w-[12rem] md:px-3.5 md:py-2 md:text-sm",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      )}
      aria-label={t("home.floatingJoin.ariaLabel")}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white",
          "light:from-indigo-600 light:via-violet-600 light:to-fuchsia-600"
        )}
        aria-hidden
      >
        <UserPlus className="size-3.5" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 truncate pr-0.5 sm:text-[13px]">{t("home.floatingJoin.cta")}</span>
    </Link>,
    document.body
  );
}
