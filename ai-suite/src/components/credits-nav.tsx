"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/i18n-provider";

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  tr: "tr-TR",
};

type Wallet = {
  credits: number | null;
  trial_days_left: number | null;
  subscription_status: string | null;
};

export function CreditsNav({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const [data, setData] = React.useState<Wallet | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    function load() {
      void fetch("/api/me/wallet", { cache: "no-store", credentials: "same-origin" })
        .then((r) => r.json() as Promise<Wallet>)
        .then((j) => {
          if (!cancelled) setData(j);
        })
        .catch(() => {
          if (!cancelled) setData(null);
        });
    }
    load();
    const id = window.setInterval(load, 60_000);
    function onFocus() {
      load();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const credits = data?.credits ?? null;
  const creditsDisplay =
    credits === null ? "…" : credits.toLocaleString(LOCALE_TAG[locale]);
  const trial =
    typeof data?.trial_days_left === "number" &&
    data.subscription_status === "trialing" &&
    data.trial_days_left >= 0
      ? data.trial_days_left
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-200 sm:text-sm",
        className
      )}
    >
      <span
        className="inline-flex items-center gap-0.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-amber-100 backdrop-blur-xl sm:gap-1 sm:px-3 sm:py-1 light:border-amber-500/40 light:bg-amber-50 light:text-amber-950"
        title={t("creditsNav.title")}
      >
        <span aria-hidden>🪙</span>
        <span>{creditsDisplay}</span>
        <span className="hidden text-slate-400 md:inline">{t("creditsNav.unit")}</span>
      </span>
      {trial !== null ? (
        <span className="hidden rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-violet-100 backdrop-blur-xl sm:inline sm:px-3">
          {trial === 1
            ? t("creditsNav.trialOne")
            : t("creditsNav.trialMany").replace("{days}", String(trial))}
        </span>
      ) : null}
    </div>
  );
}
