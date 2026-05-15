import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { billingEnsureEntitlement } from "@/lib/isendai/billing-rpc";

const DEFAULT_FREE_CREDITS = 0;
const DEFAULT_MAX_VERSIONS = 5;

/**
 * Idempotently create `isendai.entitlements` row for a newly signed-in user.
 *
 * Never throws — auth flow must not break if billing schema is unavailable.
 * Returns `true` when the row exists (created or already there).
 */
export async function ensureUserEntitlementsBootstrap(userId: string): Promise<boolean> {
  const id = userId?.trim();
  if (!id) return false;

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[ensure-user-entitlements] SUPABASE_SERVICE_ROLE_KEY missing — cannot bootstrap entitlements row."
      );
    }
    return false;
  }

  try {
    const { error } = await billingEnsureEntitlement(admin, {
      p_owner_type: "user",
      p_owner_id: id,
      p_default_credits: DEFAULT_FREE_CREDITS,
      p_default_max_versions: DEFAULT_MAX_VERSIONS,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[ensure-user-entitlements] bootstrap failed:", error.message);
      }
      return false;
    }
    return true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ensure-user-entitlements] unexpected error:", e);
    }
    return false;
  }
}
