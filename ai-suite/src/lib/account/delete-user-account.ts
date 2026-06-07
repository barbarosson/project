import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export type DeleteUserAccountResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "auth_required" | "rpc_failed" | "auth_delete_failed"; message: string };

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

  const { error: rpcError } = await admin.rpc("delete_user_account_data", { p_user_id: id });
  if (rpcError) {
    return { ok: false, code: "rpc_failed", message: rpcError.message ?? "delete_user_account_data_failed" };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) {
    return { ok: false, code: "auth_delete_failed", message: authError.message ?? "auth_delete_failed" };
  }

  return { ok: true };
}
