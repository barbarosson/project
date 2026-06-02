import { REFERRAL_COOKIE_NAME } from "@/lib/referrals/constants";
import { normalizeReferralCode } from "@/lib/referrals/code";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function referralCookieHeaderValue(code: string): string {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return "";
  return `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function parseReferralCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${REFERRAL_COOKIE_NAME}=`)) continue;
    const raw = part.slice(REFERRAL_COOKIE_NAME.length + 1);
    try {
      return normalizeReferralCode(decodeURIComponent(raw));
    } catch {
      return normalizeReferralCode(raw);
    }
  }
  return null;
}

/** Client-only: persist ?ref= from landing URLs. */
export function setReferralCookieClient(code: string): void {
  if (typeof document === "undefined") return;
  const value = referralCookieHeaderValue(code);
  if (!value) return;
  document.cookie = value;
}

export function readReferralCookieClient(): string | null {
  if (typeof document === "undefined") return null;
  return parseReferralCookie(document.cookie);
}
