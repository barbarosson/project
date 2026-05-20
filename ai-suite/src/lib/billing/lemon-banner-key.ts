import type { Locale } from "@/i18n/dictionaries";
import { DICTS } from "@/i18n/dictionaries";

import { getLemonMerchantStatus } from "./lemon-merchant-status";

export function lemonStatusBannerMessage(locale: Locale): string | null {
  const status = getLemonMerchantStatus();
  if (status === "live") return null;
  const d = DICTS[locale];
  const en = DICTS.en;
  if (status === "pending_review") {
    return d["billing.lemon.pendingReview"] ?? en["billing.lemon.pendingReview"];
  }
  if (status === "test") {
    return d["billing.lemon.testMode"] ?? en["billing.lemon.testMode"];
  }
  return d["billing.lemon.unconfigured"] ?? en["billing.lemon.unconfigured"];
}
