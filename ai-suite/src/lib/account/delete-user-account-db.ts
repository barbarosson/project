import { getDirectPostgresSql } from "@/lib/isendai/direct-postgres";

/** Purge isendai rows for a user via direct Postgres (bypasses PostgREST / RPC). */
export async function directDeleteUserAccountData(userId: string): Promise<boolean> {
  const sql = getDirectPostgresSql();
  const id = userId?.trim();
  if (!sql || !id) return false;

  try {
    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM isendai.ai_feedback
        WHERE owner_type = 'user' AND owner_id::text = ${id}
      `;
      await tx`
        DELETE FROM isendai.requests
        WHERE owner_type = 'user' AND owner_id::text = ${id}
      `;
      await tx`
        DELETE FROM isendai.lemon_processed_orders
        WHERE owner_type = 'user' AND owner_id::text = ${id}
      `;
      await tx`
        DELETE FROM isendai.welcome_bonus_grants
        WHERE user_id = ${id}::uuid
      `;
      await tx`
        DELETE FROM isendai.referral_signup_attribution
        WHERE user_id = ${id}::uuid
      `;
      await tx`
        DELETE FROM isendai.referral_reward_grants
        WHERE referee_user_id = ${id}::uuid OR referrer_user_id = ${id}::uuid
      `;
      await tx`
        DELETE FROM isendai.referral_profiles
        WHERE user_id = ${id}::uuid
      `;
      await tx`
        DELETE FROM isendai.entitlements
        WHERE owner_type = 'user' AND owner_id::text = ${id}
      `;
    });
    return true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[delete-user-account] direct SQL failed:", e);
    }
    return false;
  }
}

/** Call DB function when migration is applied but PostgREST cache lags. */
export async function directDeleteUserAccountRpc(userId: string): Promise<boolean> {
  const sql = getDirectPostgresSql();
  const id = userId?.trim();
  if (!sql || !id) return false;

  try {
    await sql`SELECT isendai.delete_user_account_data(${id}::uuid)`;
    return true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[delete-user-account] direct RPC failed:", e);
    }
    return false;
  }
}
