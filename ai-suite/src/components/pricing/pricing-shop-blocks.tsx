"use client";

import * as React from "react";
import { toast } from "sonner";

import { PricingPaygoTierCards } from "@/components/pricing-paygo-tier-cards";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { hrefToCompleteMembershipProfileForCurrentPage } from "@/lib/auth/membership-profile";
import { glassInteractive, premiumCta, textGradientHero } from "@/lib/premium-ui";

const MONTHLY_PLANS = ["starter", "growth", "scale"] as const;
const PAYGO_TIERS = ["budget", "standard", "premium"] as const;

const SUB_PLAN: Record<(typeof MONTHLY_PLANS)[number], "basic" | "pro" | "ultra"> = {
  starter: "basic",
  growth: "pro",
  scale: "ultra",
};

async function postCheckout(
  body: Record<string, unknown>,
  t: (k: string) => string
): Promise<boolean> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool_id: "corporate-whisperer", ...body }),
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
    return false;
  }
  if (res.status === 401 || json?.code === "auth_required") {
    toast.error(t("pricing.checkoutSignInRequired"));
    return false;
  }
  if (!res.ok || !json?.checkout_url) {
    toast.error(json?.error ?? t("pricing.checkoutFailed"));
    return false;
  }
  window.location.href = json.checkout_url;
  return true;
}

export function PricingMonthlyShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
        {t("pricing.monthly.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{t("pricing.monthly.sectionLead")}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {MONTHLY_PLANS.map((plan) => (
          <div key={plan} className={cn("flex flex-col rounded-2xl p-6", glassInteractive)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(`pricing.monthly.${plan}.name`)}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {t(`pricing.monthly.${plan}.price`)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
              {t(`pricing.monthly.${plan}.credits`)}
            </p>
            <p className="mt-3 flex-1 text-sm text-slate-400">{t(`pricing.monthly.${plan}.desc`)}</p>
            <Button
              className={cn("mt-5 w-full font-semibold", premiumCta)}
              disabled={busy !== null}
              onClick={() => {
                setBusy(plan);
                void postCheckout(
                  { pack: "subscription", plan: SUB_PLAN[plan], billing_interval: "monthly" },
                  t
                ).finally(() => setBusy(null));
              }}
            >
              {busy === plan ? "…" : t("pricing.buyNow")}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PricingYearlyShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
        {t("pricing.yearly.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{t("pricing.yearly.sectionLead")}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {MONTHLY_PLANS.map((plan) => (
          <div
            key={`yearly-${plan}`}
            className={cn(
              "flex flex-col rounded-2xl border border-violet-500/30 p-6 shadow-2xl backdrop-blur-xl",
              "bg-white/[0.03] transition-all duration-300 ease-out",
              "hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)]"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t(`pricing.monthly.${plan}.name`)}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {t(`pricing.yearly.${plan}.price`)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-300/85">
              {t(`pricing.yearly.${plan}.credits`)}
            </p>
            <p className="mt-3 flex-1 text-sm text-slate-400">{t(`pricing.yearly.${plan}.desc`)}</p>
            <p className="mt-2 text-xs font-medium text-emerald-400/90">{t(`pricing.yearly.${plan}.savings`)}</p>
            <Button
              className={cn("mt-5 w-full font-semibold", premiumCta)}
              disabled={busy !== null}
              onClick={() => {
                setBusy(`y-${plan}`);
                void postCheckout(
                  { pack: "subscription", plan: SUB_PLAN[plan], billing_interval: "yearly" },
                  t
                ).finally(() => setBusy(null));
              }}
            >
              {busy === `y-${plan}` ? "…" : t("pricing.buyNow")}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PricingPaygoShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={cn("text-lg font-semibold tracking-tight", textGradientHero)}>
        {t("pricing.paygo.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{t("pricing.paygo.sectionLead")}</p>
      <p className="mt-2 text-sm font-medium text-violet-200/90">{t("pricing.allPaygoPacks")}</p>
      <PricingPaygoTierCards
        tiers={PAYGO_TIERS.map((tier) => ({
          id: tier,
          label: t(`pricing.tier.${tier}`),
          price: t(`pricing.tier.${tier}Price`),
          pack: t(`pricing.pack.${tier}`),
          summary: t(`pricing.tier.${tier}Summary`),
          detail: t(`pricing.tier.${tier}Desc`),
        }))}
        detailModalTitle={t("pricing.paygo.detailModalTitle")}
        infoButtonAria={t("pricing.paygo.infoButtonAria")}
        closeLabel={t("pricing.paygo.closeDetails")}
        buyButtonLabel={t("pricing.buyNow")}
        busyTierId={busy}
        onBuyTier={(tierId) => {
          setBusy(tierId);
          void postCheckout({ pack: "paygo", tier: tierId }, t).finally(() => setBusy(null));
        }}
      />
    </section>
  );
}
