import type { User } from "@supabase/supabase-js";

/** Re-signup window: Supabase returns the original user row with an old created_at. */
const EXISTING_ACCOUNT_CREATED_AT_MS = 90_000;

/**
 * Detect "email already registered" after signUp when Supabase no longer returns
 * an empty identities array (anti-enumeration).
 */
export function signupLikelyExistingAccount(user: User | null | undefined): boolean {
  if (!user) return false;

  const identities = user.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    return true;
  }

  const createdAt = user.created_at;
  if (typeof createdAt === "string" && createdAt.length > 0) {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    if (ageMs > EXISTING_ACCOUNT_CREATED_AT_MS) {
      return true;
    }
  }

  return false;
}
