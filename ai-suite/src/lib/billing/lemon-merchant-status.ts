/** How far Lemon Squeezy is toward live card payments (set on Netlify). */
export type LemonMerchantStatus = "live" | "test" | "pending_review" | "unconfigured";

export function getLemonMerchantStatus(): LemonMerchantStatus {
  const explicit = process.env.NEXT_PUBLIC_LEMON_MERCHANT_STATUS?.trim().toLowerCase();
  if (
    explicit === "live" ||
    explicit === "test" ||
    explicit === "pending_review" ||
    explicit === "unconfigured"
  ) {
    return explicit;
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  if (!apiKey || !storeId) return "unconfigured";

  if (process.env.LEMON_SQUEEZY_LIVE_MODE === "1") return "live";
  return "test";
}

export function isLiveCheckoutExpected(): boolean {
  return getLemonMerchantStatus() === "live";
}
