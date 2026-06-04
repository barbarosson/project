import { creditsToTenths } from "@/lib/credits-units";

/** Whole credits granted once when membership profile + email verification are complete. */
export const WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE = 100;

export const WELCOME_MEMBERSHIP_BONUS_CREDITS_TENTHS = creditsToTenths(
  WELCOME_MEMBERSHIP_BONUS_CREDITS_WHOLE
);
