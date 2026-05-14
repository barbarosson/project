import type { SupabaseClient } from "@supabase/supabase-js";

type WalletRow = {
  credits_balance: number | null;
  max_versions_per_request: number | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
};

/**
 * Reads `isendai.entitlements` for the current JWT user via SECURITY DEFINER RPC
 * (no service role). Returns `"rpc_missing"` when the RPC errors, is absent, or
 * returns no row (e.g. `auth.uid()` not visible to Postgres, or no matching entitlement).
 * Callers with a service role should fall back to an admin read in that case — never
 * treat an empty RPC result as a real zero balance.
 */
export async function readUserEntitlementWalletFromSession(
  supabase: SupabaseClient
): Promise<WalletRow | "rpc_missing"> {
  const { data, error } = await supabase.rpc("user_entitlement_wallet");
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[user_entitlement_wallet]", error.message);
    }
    return "rpc_missing";
  }
  if (data == null) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[user_entitlement_wallet] null body — use admin fallback if available");
    }
    return "rpc_missing";
  }
  const rows = Array.isArray(data) ? data : [data];
  const row = rows[0] as WalletRow | undefined;
  if (!row) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[user_entitlement_wallet] empty rowset — use admin fallback if available");
    }
    return "rpc_missing";
  }
  return row;
}
