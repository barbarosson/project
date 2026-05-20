/** GA4 helpers — scripts load only in production via root layout. */

export type GaEventParams = Record<string, string | number | boolean | undefined>;

function isGaEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV?.trim().toLowerCase() !== "production") {
    return false;
  }
  return typeof window.gtag === "function";
}

export function trackGaEvent(eventName: string, params?: GaEventParams): void {
  if (!isGaEnabled()) return;
  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleaned[key] = value;
    }
  }
  window.gtag!("event", eventName, cleaned);
}

export function trackGaLogin(method: string): void {
  trackGaEvent("login", { method });
}

export function trackGaBeginCheckout(itemId: string, itemCategory: string): void {
  trackGaEvent("begin_checkout", {
    currency: "USD",
    item_id: itemId,
    item_category: itemCategory,
  });
}

export function trackGaPurchase(itemId: string, itemCategory: string): void {
  trackGaEvent("purchase", {
    currency: "USD",
    item_id: itemId,
    item_category: itemCategory,
  });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
