/** Stored balances and charges use tenths (1 credit = 10 tenths → 0.1 credit precision). */
export const CREDIT_TENTHS_PER_CREDIT = 10;

export function creditsToTenths(wholeCredits: number): number {
  return Math.round(wholeCredits * CREDIT_TENTHS_PER_CREDIT);
}

export function tenthsToDisplayCredits(tenths: number): number {
  return tenths / CREDIT_TENTHS_PER_CREDIT;
}

/** Human-readable credit amount (e.g. 12, 1.2, 0.2). */
export function formatCreditsFromTenths(tenths: number): string {
  const n = Math.max(0, tenths);
  if (n % CREDIT_TENTHS_PER_CREDIT === 0) {
    return String(n / CREDIT_TENTHS_PER_CREDIT);
  }
  const s = (n / CREDIT_TENTHS_PER_CREDIT).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

type BillingLabels = {
  creditOne: string;
  creditsMany: string;
};

/** Localized label for a charge shown on tool buttons (tenths in, credits out). */
export function formatBillingCreditLabel(tenths: number, labels: BillingLabels): string {
  const display = formatCreditsFromTenths(tenths);
  if (display === "1") return labels.creditOne;
  return labels.creditsMany.replace("{n}", display);
}
