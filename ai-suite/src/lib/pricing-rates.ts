/**
 * Monthly catalog rates (USD). Custom mix pricing aligns per-tier request rates
 * with these bundles: high volume → low $/req, entry bundle → higher $/req.
 */
export const MONTHLY_BUNDLE_USD = {
  /** 100 requests */
  entry: 7.99,
  /** 300 requests */
  mid: 9.99,
  /** 1000 requests */
  bulk: 19.99,
} as const;

/** Per-request USD rates for custom monthly mix (maps AI tier → closest bundle economics). */
export const CUSTOM_MIX_RATE_USD = {
  /** Low-tier / budget models — bulk endpoint pricing */
  low: MONTHLY_BUNDLE_USD.bulk / 1000,
  /** Mid-tier models — middle bundle */
  mid: MONTHLY_BUNDLE_USD.mid / 300,
  /** High-tier / premium models — entry bundle (smallest volume, highest $/req) */
  high: MONTHLY_BUNDLE_USD.entry / 100,
} as const;

export function estimateCustomMonthlyUsd(low: number, mid: number, high: number): number {
  const a = Math.max(0, Math.floor(Number(low) || 0));
  const b = Math.max(0, Math.floor(Number(mid) || 0));
  const c = Math.max(0, Math.floor(Number(high) || 0));
  return (
    a * CUSTOM_MIX_RATE_USD.low + b * CUSTOM_MIX_RATE_USD.mid + c * CUSTOM_MIX_RATE_USD.high
  );
}

export function formatUsd(amount: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
