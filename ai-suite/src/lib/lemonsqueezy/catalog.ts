/**
 * Lemon Squeezy variant IDs from dashboard (.env.local).
 * Yearly variants optional — enable when products exist (same credits per billing reset).
 */

import { PAYGO_PACK_CREDITS, type ModelSalesTier } from "@/models/models";

export type SubscriptionPlanKey = "basic" | "pro" | "ultra";
export type BillingIntervalKey = "monthly" | "yearly";
export type PaygoTierKey = ModelSalesTier;

export type CheckoutPackKey =
  | { kind: "subscription"; plan: SubscriptionPlanKey; interval: BillingIntervalKey }
  | { kind: "one_time_trial" }
  | { kind: "paygo"; tier: PaygoTierKey };

const TRIAL_CREDITS_ON_SUB_START = 10;

export const SUBSCRIPTION_MONTHLY_CREDITS: Record<SubscriptionPlanKey, number> = {
  basic: 500,
  pro: 1000,
  ultra: 5000,
};

export const ONE_TIME_TRIAL_CREDITS = 10;

export function trialCreditsForSubscriptionStart(): number {
  return TRIAL_CREDITS_ON_SUB_START;
}

function envTrim(key: string): string | null {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : null;
}

function variantEnvKey(pack: CheckoutPackKey): string | null {
  if (pack.kind === "one_time_trial") {
    return envTrim("LEMON_SQUEEZY_VARIANT_ONE_TIME_TRIAL") ?? envTrim("LEMON_SQUEEZY_VARIANT_ID");
  }
  if (pack.kind === "paygo") {
    const key =
      pack.tier === "budget"
        ? "LEMON_SQUEEZY_VARIANT_PAYGO_BUDGET"
        : pack.tier === "standard"
          ? "LEMON_SQUEEZY_VARIANT_PAYGO_STANDARD"
          : "LEMON_SQUEEZY_VARIANT_PAYGO_PREMIUM";
    return envTrim(key);
  }
  const suffix =
    pack.interval === "monthly"
      ? ({
          basic: "BASIC_MONTHLY",
          pro: "PRO_MONTHLY",
          ultra: "ULTRA_MONTHLY",
        } as const)
      : ({
          basic: "BASIC_YEARLY",
          pro: "PRO_YEARLY",
          ultra: "ULTRA_YEARLY",
        } as const);
  const k = `LEMON_SQUEEZY_VARIANT_${suffix[pack.plan]}` as const;
  return envTrim(k);
}

export function resolveVariantId(pack: CheckoutPackKey): string | null {
  return variantEnvKey(pack);
}

export function subscriptionCreditsForVariantId(variantId: string): number | null {
  const v = variantId.trim();
  const pairs: Array<{ env: string; credits: number }> = [
    { env: "LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.basic },
    { env: "LEMON_SQUEEZY_VARIANT_PRO_MONTHLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.pro },
    { env: "LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.ultra },
    { env: "LEMON_SQUEEZY_VARIANT_BASIC_YEARLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.basic },
    { env: "LEMON_SQUEEZY_VARIANT_PRO_YEARLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.pro },
    { env: "LEMON_SQUEEZY_VARIANT_ULTRA_YEARLY", credits: SUBSCRIPTION_MONTHLY_CREDITS.ultra },
  ];
  for (const { env, credits } of pairs) {
    const ev = envTrim(env);
    if (ev && ev === v) return credits;
  }
  return null;
}

export function oneTimeCreditsForVariantId(variantId: string): number | null {
  const one = envTrim("LEMON_SQUEEZY_VARIANT_ONE_TIME_TRIAL") ?? envTrim("LEMON_SQUEEZY_VARIANT_ID");
  if (one && one === variantId.trim()) return ONE_TIME_TRIAL_CREDITS;
  return null;
}

/** Credits for one-time pay-as-you-go pack variants (separate Lemon products per tier). */
export function paygoCreditsForVariantId(variantId: string): number | null {
  const tier = paygoTierForVariantId(variantId);
  return tier ? PAYGO_PACK_CREDITS[tier] : null;
}

export function paygoTierForVariantId(variantId: string): PaygoTierKey | null {
  const v = variantId.trim();
  const rows: Array<{ env: string; tier: PaygoTierKey }> = [
    { env: "LEMON_SQUEEZY_VARIANT_PAYGO_BUDGET", tier: "budget" },
    { env: "LEMON_SQUEEZY_VARIANT_PAYGO_STANDARD", tier: "standard" },
    { env: "LEMON_SQUEEZY_VARIANT_PAYGO_PREMIUM", tier: "premium" },
  ];
  for (const { env, tier } of rows) {
    const ev = envTrim(env);
    if (ev && ev === v) return tier;
  }
  return null;
}

export function planKeyFromVariantId(variantId: string): SubscriptionPlanKey | null {
  const v = variantId.trim();
  const map: Array<{ env: string; plan: SubscriptionPlanKey }> = [
    { env: "LEMON_SQUEEZY_VARIANT_BASIC_MONTHLY", plan: "basic" },
    { env: "LEMON_SQUEEZY_VARIANT_BASIC_YEARLY", plan: "basic" },
    { env: "LEMON_SQUEEZY_VARIANT_PRO_MONTHLY", plan: "pro" },
    { env: "LEMON_SQUEEZY_VARIANT_PRO_YEARLY", plan: "pro" },
    { env: "LEMON_SQUEEZY_VARIANT_ULTRA_MONTHLY", plan: "ultra" },
    { env: "LEMON_SQUEEZY_VARIANT_ULTRA_YEARLY", plan: "ultra" },
  ];
  for (const { env, plan } of map) {
    const ev = envTrim(env);
    if (ev && ev === v) return plan;
  }
  return null;
}
