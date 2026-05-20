"use client";

import * as React from "react";
import { toast } from "sonner";

import { PricingPackCards } from "@/components/pricing-pack-cards";
import { trackGaBeginCheckout } from "@/lib/analytics/gtag";
import { useI18n } from "@/i18n/i18n-provider";
import { hrefToCompleteMembershipProfileForCurrentPage } from "@/lib/auth/membership-profile";
import { pageSectionLabel } from "@/lib/premium-ui";

const MONTHLY_PLANS = ["starter", "growth", "scale"] as const;
const PAYGO_TIERS = ["budget", "standard", "premium"] as const;

const SUB_PLAN: Record<(typeof MONTHLY_PLANS)[number], "basic" | "pro" | "ultra"> = {
  starter: "basic",
  growth: "pro",
  scale: "ultra",
};

const YEARLY_CARD =
  "border border-violet-500/30 bg-white/[0.03] shadow-2xl backdrop-blur-xl hover:border-violet-500/50 hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)]";

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
  const pack = body.pack;
  if (pack === "subscription" && typeof body.plan === "string") {
    const interval = body.billing_interval === "yearly" ? "yearly" : "monthly";
    trackGaBeginCheckout(`${body.plan}_${interval}`, "subscription");
  } else if (pack === "paygo" && typeof body.tier === "string") {
    trackGaBeginCheckout(String(body.tier), "paygo");
  } else {
    trackGaBeginCheckout("one_time_trial", "one_time");
  }
  window.location.href = json.checkout_url;
  return true;
}

function packModalProps(t: (k: string) => string) {
  return {
    detailModalTitle: t("pricing.pack.detailModalTitle"),
    infoButtonAria: t("pricing.pack.infoButtonAria"),
    closeLabel: t("pricing.paygo.closeDetails"),
    buyButtonLabel: t("pricing.buyNow"),
  };
}

export function PricingMonthlyShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={pageSectionLabel}>
        {t("pricing.monthly.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{t("pricing.monthly.sectionLead")}</p>
      <PricingPackCards
        {...packModalProps(t)}
        busyPackId={busy}
        onBuyPack={(plan) => {
          setBusy(plan);
          void postCheckout(
            {
              pack: "subscription",
              plan: SUB_PLAN[plan as (typeof MONTHLY_PLANS)[number]],
              billing_interval: "monthly",
            },
            t
          ).finally(() => setBusy(null));
        }}
        packs={MONTHLY_PLANS.map((plan) => ({
          id: plan,
          label: t(`pricing.monthly.${plan}.name`),
          price: t(`pricing.monthly.${plan}.price`),
          pack: t(`pricing.monthly.${plan}.credits`),
          summary: t(`pricing.monthly.${plan}.desc`),
          detail: t(`pricing.monthly.${plan}.detail`),
        }))}
      />
    </section>
  );
}

export function PricingYearlyShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={pageSectionLabel}>
        {t("pricing.yearly.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{t("pricing.yearly.sectionLead")}</p>
      <PricingPackCards
        {...packModalProps(t)}
        busyPackId={busy}
        onBuyPack={(plan) => {
          setBusy(`y-${plan}`);
          void postCheckout(
            {
              pack: "subscription",
              plan: SUB_PLAN[plan as (typeof MONTHLY_PLANS)[number]],
              billing_interval: "yearly",
            },
            t
          ).finally(() => setBusy(null));
        }}
        packs={MONTHLY_PLANS.map((plan) => ({
          id: plan,
          label: t(`pricing.monthly.${plan}.name`),
          price: t(`pricing.yearly.${plan}.price`),
          pack: t(`pricing.yearly.${plan}.credits`),
          summary: t(`pricing.yearly.${plan}.desc`),
          detail: t(`pricing.yearly.${plan}.detail`),
          extra: t(`pricing.yearly.${plan}.savings`),
          cardClassName: YEARLY_CARD,
        }))}
      />
    </section>
  );
}

export function PricingPaygoShop() {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className={pageSectionLabel}>
        {t("pricing.paygo.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{t("pricing.paygo.sectionLead")}</p>
      <p className="mt-2 text-sm font-medium text-violet-200/90">{t("pricing.allPaygoPacks")}</p>
      <PricingPackCards
        {...packModalProps(t)}
        busyPackId={busy}
        onBuyPack={(tierId) => {
          setBusy(tierId);
          void postCheckout({ pack: "paygo", tier: tierId }, t).finally(() => setBusy(null));
        }}
        packs={PAYGO_TIERS.map((tier) => ({
          id: tier,
          label: t(`pricing.tier.${tier}`),
          price: t(`pricing.tier.${tier}Price`),
          pack: t(`pricing.pack.${tier}`),
          summary: t(`pricing.tier.${tier}Summary`),
          detail: t(`pricing.tier.${tier}Desc`),
        }))}
      />
    </section>
  );
}
