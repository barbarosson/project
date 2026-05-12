/**
 * Monthly catalog rates (USD). Custom mix pricing aligns per-tier request rates
 * with these bundles: high volume → low $/req, entry bundle → higher $/req.
 */
export const MONTHLY_BUNDLE_USD = {
  /** Starter tier price */
  entry: 7.99,
  /** Growth tier price */
  mid: 9.99,
  /** Scale tier price */
  bulk: 19.99,
} as const;

/** Included monthly requests per bundle tier (same USD prices, higher volumes). */
export const MONTHLY_REQUEST_COUNTS = {
  /** Starter — $7.99 */
  entry: 500,
  /** Growth — $9.99 */
  mid: 1000,
  /** Scale — $19.99 */
  bulk: 5000,
} as const;

/** Per-request USD rates for custom monthly mix (maps AI tier → closest bundle economics). */
export const CUSTOM_MIX_RATE_USD = {
  /** Low-tier / budget models — bulk endpoint pricing */
  low: MONTHLY_BUNDLE_USD.bulk / MONTHLY_REQUEST_COUNTS.bulk,
  /** Mid-tier models — middle bundle */
  mid: MONTHLY_BUNDLE_USD.mid / MONTHLY_REQUEST_COUNTS.mid,
  /** High-tier / premium models — entry bundle (smallest volume, highest $/req) */
  high: MONTHLY_BUNDLE_USD.entry / MONTHLY_REQUEST_COUNTS.entry,
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
