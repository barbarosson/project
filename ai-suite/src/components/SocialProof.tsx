"use client";

import * as React from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n/i18n-provider";
import { SOCIAL_PROOF_MESSAGES } from "@/i18n/social-proof-messages";
import { isStagingDeploy } from "@/lib/deploy-env";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SocialProof() {
  const { locale, t } = useI18n();

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const messages = SOCIAL_PROOF_MESSAGES[locale] ?? SOCIAL_PROOF_MESSAGES.en;

    function scheduleNext() {
      const delayMs = randomBetween(20_000, 45_000);
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const msg = messages[randomBetween(0, messages.length - 1)];
        const label = isStagingDeploy() ? `${t("socialProof.demoPrefix")} ` : "";
        toast(`${label}${msg}`, {
          position: "bottom-left",
          duration: 6500,
          className:
            "border border-white/[0.12] bg-[#0c0c0f]/95 text-slate-100 shadow-[0_8px_30px_rgba(139,92,246,0.15)] backdrop-blur-xl",
        });
        scheduleNext();
      }, delayMs);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [locale, t]);

  return null;
}
