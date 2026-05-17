"use client";

import * as React from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { premiumCta } from "@/lib/premium-ui";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/i18n-provider";
import { SUBSCRIPTION_TRIAL_CREDITS } from "@/lib/lemonsqueezy/catalog";
import { hrefToCompleteMembershipProfileForCurrentPage } from "@/lib/auth/membership-profile";

type BillingToggle = "monthly" | "yearly";

const PAYGO_TIERS = ["budget", "standard", "premium"] as const;

type PricingModalContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const PricingModalContext = React.createContext<PricingModalContextValue | null>(null);

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  tr: "tr-TR",
};

export function usePricingModal(): PricingModalContextValue {
  const ctx = React.useContext(PricingModalContext);
  if (!ctx) {
    return { open: () => {}, close: () => {}, isOpen: false };
  }
  return ctx;
}

const LS_TRIAL_KEY = "isendai_ls_subscription_trial_used";

function planBaseMonthlyUsd(plan: "basic" | "pro" | "ultra"): number {
  return plan === "basic" ? 7.99 : plan === "pro" ? 9.99 : 19.99;
}

function yearlyRenewalTotalUsd(plan: "basic" | "pro" | "ultra"): number {
  const perMoDiscounted = planBaseMonthlyUsd(plan) * 0.8;
  return Math.round(perMoDiscounted * 12 * 100) / 100;
}

function formatUsd(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function monthlyThenLabel(
  t: (key: string) => string,
  plan: "basic" | "pro" | "ultra",
  interval: BillingToggle
): string {
  const base = planBaseMonthlyUsd(plan);
  if (interval === "monthly") {
    return t("pricingModal.thenMonthly").replace("{price}", `$${base.toFixed(2)}`);
  }
  const perMo = base * 0.8;
  return t("pricingModal.thenYearly").replace("{price}", `$${perMo.toFixed(2)}`);
}

async function startCheckout(
  t: (key: string) => string,
  plan: "basic" | "pro" | "ultra",
  interval: BillingToggle,
  toolId: string
) {
  try {
    if (typeof window !== "undefined" && window.localStorage.getItem(LS_TRIAL_KEY) === "1") {
      toast.message(t("pricingModal.trialAlreadyUsedToast"));
    }
  } catch {
    // ignore
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pack: "subscription",
      plan,
      billing_interval: interval,
      tool_id: toolId,
    }),
  });
  const raw = await res.text();
  let json: { checkout_url?: string; error?: string; code?: string } | null = null;
  try {
    json = JSON.parse(raw) as { checkout_url?: string; error?: string; code?: string };
  } catch {
    json = null;
  }

  if (res.status === 403 && json?.code === "profile_required") {
    toast.error(t("pricing.checkoutProfileRequired"));
    window.location.assign(hrefToCompleteMembershipProfileForCurrentPage());
    return;
  }
  if (res.status === 401 || json?.code === "auth_required") {
    toast.error(t("pricing.checkoutSignInRequired"));
    return;
  }
  if (!res.ok || !json?.checkout_url) {
    toast.error(json?.error ?? t("pricingModal.checkoutFailed"));
    return;
  }

  try {
    window.localStorage.setItem(LS_TRIAL_KEY, "1");
  } catch {
    // ignore
  }

  window.location.href = json.checkout_url;
}

async function startPaygoCheckout(
  t: (key: string) => string,
  toolId: string,
  tier: (typeof PAYGO_TIERS)[number]
) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pack: "paygo", tier, tool_id: toolId }),
  });
  const raw = await res.text();
  let json: { checkout_url?: string; error?: string; code?: string } | null = null;
  try {
    json = JSON.parse(raw) as { checkout_url?: string; error?: string; code?: string };
  } catch {
    json = null;
  }
  if (res.status === 403 && json?.code === "profile_required") {
    toast.error(t("pricing.checkoutProfileRequired"));
    window.location.assign(hrefToCompleteMembershipProfileForCurrentPage());
    return;
  }
  if (res.status === 401 || json?.code === "auth_required") {
    toast.error(t("pricing.checkoutSignInRequired"));
    return;
  }
  if (!res.ok || !json?.checkout_url) {
    toast.error(json?.error ?? t("pricingModal.checkoutFailed"));
    return;
  }
  window.location.href = json.checkout_url;
}

function InnerPlan({
  title,
  credits,
  badge,
  t,
  locale,
}: {
  title: string;
  credits: number;
  badge?: string;
  t: (key: string) => string;
  locale: Locale;
}) {
  const creditsStr = credits.toLocaleString(LOCALE_TAG[locale]);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {badge ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-300">
        {t("pricingModal.planCreditsLine").replace("{credits}", creditsStr)}
      </p>
    </>
  );
}

function PlanCard({
  t,
  locale,
  planTitle,
  credits,
  highlight,
  plan,
  interval,
  toolId,
}: {
  t: (key: string) => string;
  locale: Locale;
  planTitle: string;
  credits: number;
  highlight?: boolean;
  plan: "basic" | "pro" | "ultra";
  interval: BillingToggle;
  toolId: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const perMoAfterTrial = planBaseMonthlyUsd(plan) * (interval === "yearly" ? 0.8 : 1);
  const yearTotal = yearlyRenewalTotalUsd(plan);

  const body = (
    <>
      <InnerPlan
        title={planTitle}
        credits={credits}
        badge={plan === "pro" ? t("pricingModal.mostPopular") : undefined}
        t={t}
        locale={locale}
      />
      <p className="mt-2 text-xs font-medium text-emerald-200/90">
        {t("pricingModal.trialGiftLine").replace(
          "{credits}",
          SUBSCRIPTION_TRIAL_CREDITS.toLocaleString(LOCALE_TAG[locale])
        )}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{t("pricingModal.afterTrialNote")}</p>
      <Button
        className={cn(
          "mt-4 w-full font-semibold",
          highlight
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
            : "border border-white/15 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]"
        )}
        disabled={busy}
        variant={highlight ? "default" : "outline"}
        onClick={() => {
          setBusy(true);
          void startCheckout(t, plan, interval, toolId).finally(() => setBusy(false));
        }}
      >
        {t("pricingModal.startTrial")}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-400">{monthlyThenLabel(t, plan, interval)}</p>
      {interval === "yearly" ? (
        <p className="mt-1.5 text-center text-xs text-slate-300">
          {t("pricingModal.yearSingleCharge")
            .replace("{total}", formatUsd(yearTotal, locale))
            .replace("{perMonth}", formatUsd(perMoAfterTrial, locale))}
        </p>
      ) : null}
    </>
  );

  if (highlight) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/35 via-fuchsia-500/25 to-indigo-500/35 p-[1px] shadow-xl">
        <div className="flex flex-col rounded-2xl bg-[#0b0b10]/95 p-5 backdrop-blur-xl">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.12] bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
      {body}
    </div>
  );
}

export function PricingModalShell({
  open,
  onClose,
  toolId,
}: {
  open: boolean;
  onClose: () => void;
  toolId: string;
}) {
  const { t, locale } = useI18n();
  const [interval, setInterval] = React.useState<BillingToggle>("monthly");
  const [busyPaygo, setBusyPaygo] = React.useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label={t("pricingModal.closeAria")}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[101] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.14]",
          "bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-transparent shadow-2xl backdrop-blur-2xl"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
          <div>
            <h2 id="pricing-title" className="text-xl font-semibold tracking-tight text-white">
              {t("pricingModal.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{t("pricingModal.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            aria-label={t("pricingModal.closeAria")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mx-auto mb-8 flex max-w-md justify-center rounded-full border border-white/[0.12] bg-black/30 p-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-medium transition",
                interval === "monthly" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
              )}
              onClick={() => setInterval("monthly")}
            >
              {t("pricingModal.monthly")}
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-medium transition",
                interval === "yearly" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
              )}
              onClick={() => setInterval("yearly")}
            >
              {t("pricingModal.yearly")} <span className="text-emerald-400/90">(-20%)</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard
              t={t}
              locale={locale}
              planTitle={t("pricingModal.plan.basic")}
              credits={500}
              plan="basic"
              interval={interval}
              toolId={toolId}
            />
            <PlanCard
              t={t}
              locale={locale}
              planTitle={t("pricingModal.plan.pro")}
              credits={1000}
              highlight
              plan="pro"
              interval={interval}
              toolId={toolId}
            />
            <PlanCard
              t={t}
              locale={locale}
              planTitle={t("pricingModal.plan.ultra")}
              credits={5000}
              plan="ultra"
              interval={interval}
              toolId={toolId}
            />
          </div>

          <div className="mt-8 border-t border-white/[0.06] pt-6">
            <p className="text-center text-sm font-semibold text-slate-100">
              {t("pricingModal.oneTimePacksTitle")}
            </p>
            <p className="mt-1 text-center text-xs text-slate-500">{t("pricingModal.oneTimePacksLead")}</p>
            <p className="mt-2 text-center text-xs font-medium text-violet-200/90">{t("pricing.allPaygoPacks")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYGO_TIERS.map((tier) => (
                <div
                  key={tier}
                  className="flex flex-col rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 shadow-inner backdrop-blur-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">
                    {t(`pricing.tier.${tier}`)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{t(`pricing.pack.${tier}`)}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-[11px] leading-snug text-slate-400">
                    {t(`pricing.tier.${tier}Summary`)}
                  </p>
                  <Button
                    type="button"
                    className={cn("mt-3 w-full font-semibold", premiumCta)}
                    disabled={busyPaygo !== null}
                    onClick={() => {
                      setBusyPaygo(tier);
                      void startPaygoCheckout(t, toolId, tier).finally(() => setBusyPaygo(null));
                    }}
                  >
                    {busyPaygo === tier ? "…" : t("pricing.buyNow")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function openPricingModal(toolId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("isendai:open-pricing", { detail: { toolId: toolId ?? "corporate-whisperer" } })
  );
}

export function PricingModalProvider({
  children,
  defaultToolId = "corporate-whisperer",
}: {
  children: React.ReactNode;
  defaultToolId?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [toolId, setToolId] = React.useState(defaultToolId);

  const value = React.useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen]
  );

  React.useEffect(() => {
    function onEv(e: Event) {
      const d = (e as CustomEvent<{ toolId?: string }>).detail;
      if (typeof d?.toolId === "string" && d.toolId.length > 0) {
        setToolId(d.toolId);
      }
      setIsOpen(true);
    }
    window.addEventListener("isendai:open-pricing", onEv);
    return () => window.removeEventListener("isendai:open-pricing", onEv);
  }, []);

  return (
    <PricingModalContext.Provider value={value}>
      {children}
      <PricingModalShell open={isOpen} onClose={() => setIsOpen(false)} toolId={toolId} />
    </PricingModalContext.Provider>
  );
}
