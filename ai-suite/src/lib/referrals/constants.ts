import { creditsToTenths } from "@/lib/credits-units";

/** Whole credits granted to referrer and referee on qualified signup. */
export const REFERRAL_BONUS_CREDITS_WHOLE = 50;

export const REFERRAL_BONUS_CREDITS_TENTHS = creditsToTenths(REFERRAL_BONUS_CREDITS_WHOLE);

export const REFERRAL_COOKIE_NAME = "isendai_ref";

export const REFERRAL_CODE_LENGTH = 8;

/** Same referrer + IP: block the 3rd+ signup within 24h (see DB function). */
export const REFERRAL_IP_WINDOW_HOURS = 24;

export const REFERRAL_MAX_OTHER_SIGNUPS_SAME_IP = 2;
