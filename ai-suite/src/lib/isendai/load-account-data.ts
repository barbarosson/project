import type { SupabaseClient } from "@supabase/supabase-js";

import { readUserEntitlementWalletFromSession } from "@/lib/isendai/user-wallet-from-session";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type AccountEntitlement = {
  credits_balance: number;
  max_versions_per_request: number;
  plan_id: string | null;
  plan_status: string | null;
  current_period_end: string | null;
};

export type AccountRequestRow = {
  id: string;
  tool_id: string;
  model_id: string;
  created_at: string;
  credits_charged: number;
  max_versions: number;
};

/**
 * Loads entitlement + recent requests for /account (and similar pages).
 * Session JWT cannot read isendai tables directly (RLS has no policies).
 * Uses SECURITY DEFINER RPC first, then service-role admin for requests / fallback.
 */
export async function loadAccountEntitlementsAndRequests(
  userId: string,
  sessionSupabase: SupabaseClient,
  requestLimit = 20
): Promise<{ ent: AccountEntitlement | null; requests: AccountRequestRow[] }> {
  let ent: AccountEntitlement | null = null;

  const wallet = await readUserEntitlementWalletFromSession(sessionSupabase);
  if (wallet !== "rpc_missing") {
    ent = {
      credits_balance: Number(wallet.credits_balance ?? 0),
      max_versions_per_request: Number(wallet.max_versions_per_request ?? 5) || 5,
      plan_id: null,
      plan_status: wallet.subscription_status ?? null,
      current_period_end: null,
    };
  }

  const admin = createSupabaseAdminClientOrNull();
  if (admin) {
    if (!ent) {
      const { data } = await admin
        .schema("isendai")
        .from("entitlements")
        .select(
          "credits_balance,max_versions_per_request,plan_id,plan_status,current_period_end"
        )
        .eq("owner_type", "user")
        .eq("owner_id", userId)
        .maybeSingle();
      ent = data;
    }

    const { data: requests } = await admin
      .schema("isendai")
      .from("requests")
      .select("id,tool_id,model_id,created_at,credits_charged,max_versions")
      .eq("owner_type", "user")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(requestLimit);

    return { ent, requests: requests ?? [] };
  }

  return { ent, requests: [] };
}
