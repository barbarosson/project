/** Plan limits + Lemon Squeezy MoR helpers (checkout stub when keys absent). */

export type PlanId = "dev" | "starter" | "agency" | "scale";

export const PLAN_LIMITS: Record<
  PlanId,
  { pageviews: number; label: string; priceUsd: number | null }
> = {
  dev: { pageviews: 1_000_000, label: "Developer", priceUsd: null },
  starter: { pageviews: 50_000, label: "Starter", priceUsd: 29 },
  agency: { pageviews: 300_000, label: "Agency", priceUsd: 79 },
  scale: { pageviews: 2_000_000, label: "Scale", priceUsd: 199 },
};

export function isPlanId(v: string): v is PlanId {
  return v in PLAN_LIMITS;
}

export function currentQuotaMonth(d = new Date()): string {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

export function quotaUsagePct(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}

/** Soft warning when used >= softWarningPct of limit. */
export function isSoftWarning(
  used: number,
  limit: number,
  softWarningPct = 90
): boolean {
  return used >= Math.floor((limit * softWarningPct) / 100);
}

export function isHardOverQuota(used: number, limit: number): boolean {
  return used >= limit;
}

export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      (process.env.LEMONSQUEEZY_VARIANT_STARTER ||
        process.env.LEMONSQUEEZY_VARIANT_AGENCY)
  );
}

export function variantForPlan(plan: PlanId): string | null {
  const map: Record<PlanId, string | undefined> = {
    dev: undefined,
    starter: process.env.LEMONSQUEEZY_VARIANT_STARTER,
    agency: process.env.LEMONSQUEEZY_VARIANT_AGENCY,
    scale: process.env.LEMONSQUEEZY_VARIANT_SCALE,
  };
  return map[plan] || null;
}

export function planFromVariant(variantId: string | number): PlanId | null {
  const v = String(variantId);
  if (v && v === process.env.LEMONSQUEEZY_VARIANT_STARTER) return "starter";
  if (v && v === process.env.LEMONSQUEEZY_VARIANT_AGENCY) return "agency";
  if (v && v === process.env.LEMONSQUEEZY_VARIANT_SCALE) return "scale";
  return null;
}

/**
 * Create a Lemon Squeezy checkout URL when configured.
 * Returns null when MoR keys are absent (caller should stub).
 */
export async function createLemonCheckout(opts: {
  plan: PlanId;
  orgId: string;
  email: string;
}): Promise<{ url: string } | { stub: true; reason: string }> {
  if (!isBillingConfigured()) {
    return {
      stub: true,
      reason:
        "Lemon Squeezy not configured. Set LEMONSQUEEZY_API_KEY, STORE_ID, and VARIANT_* env vars.",
    };
  }
  const variantId = variantForPlan(opts.plan);
  if (!variantId) {
    return { stub: true, reason: `No variant ID for plan ${opts.plan}` };
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email,
            // LS requires string custom values; webhook reads meta.custom_data
            custom: {
              org_id: String(opts.orgId),
              plan: String(opts.plan),
            },
          },
          product_options: {
            redirect_url: `${appUrl}/billing?checkout=success`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Lemon Squeezy checkout error", res.status, text);
    return { stub: true, reason: `Lemon Squeezy API error (${res.status})` };
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = json.data?.attributes?.url;
  if (!url) {
    return { stub: true, reason: "Checkout response missing URL" };
  }
  return { url };
}
