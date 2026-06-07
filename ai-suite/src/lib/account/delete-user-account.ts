import {
  directDeleteUserAccountData,
  directDeleteUserAccountRpc,
} from "@/lib/account/delete-user-account-db";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type DeleteUserAccountResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "auth_required" | "rpc_failed" | "auth_delete_failed"; message: string };

function isSchemaOrRpcError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("invalid schema") ||
    m.includes("schema cache") ||
    m.includes("could not find the function") ||
    m.includes("does not exist")
  );
}

async function purgeUserIsendaiData(userId: string): Promise<DeleteUserAccountResult | null> {
  if (await directDeleteUserAccountData(userId)) {
    return null;
  }

  if (await directDeleteUserAccountRpc(userId)) {
    return null;
  }

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { ok: false, code: "not_configured", message: "service_role_missing" };
  }

  const { error: rpcError } = await admin.rpc("delete_user_account_data", { p_user_id: userId });
  if (!rpcError) {
    return null;
  }

  if (isSchemaOrRpcError(rpcError.message)) {
    if (await directDeleteUserAccountData(userId)) {
      return null;
    }
    return {
      ok: false,
      code: "rpc_failed",
      message:
        "Account data could not be removed. Add SUPABASE_DATABASE_URL on the server or apply the delete_user_account_data migration in Supabase.",
    };
  }

  return { ok: false, code: "rpc_failed", message: rpcError.message ?? "delete_user_account_data_failed" };
}

/**
 * Removes all isendai rows for the user, then deletes the Supabase Auth user.
 * Caller must verify the authenticated user matches `userId`.
 */
export async function deleteUserAccount(userId: string): Promise<DeleteUserAccountResult> {
  const id = userId?.trim();
  if (!id) {
    return { ok: false, code: "auth_required", message: "missing_user_id" };
  }

  const admin = createSupabaseAdminClientOrNull();
  if (!admin) {
    return { ok: false, code: "not_configured", message: "service_role_missing" };
  }

  const purgeError = await purgeUserIsendaiData(id);
  if (purgeError) {
    return purgeError;
  }

  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) {
    return { ok: false, code: "auth_delete_failed", message: authError.message ?? "auth_delete_failed" };
  }

  return { ok: true };
}
