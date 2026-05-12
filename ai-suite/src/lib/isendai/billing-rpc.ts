import type { SupabaseClient } from "@supabase/supabase-js";
import postgres, { type JSONValue } from "postgres";

/** Same shapes PostgREST returns so callers can keep using `.message`. */
export type BillingRpcError = { message: string };

let directSql: ReturnType<typeof postgres> | null = null;

function getDirectPostgresUrl(): string | null {
  const u =
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.DIRECT_POSTGRES_URL?.trim();
  return u && u.length > 0 ? u : null;
}

function getDirectSql(): ReturnType<typeof postgres> | null {
  const url = getDirectPostgresUrl();
  if (!url) return null;
  if (!directSql) {
    directSql = postgres(url, {
      ssl: "require",
      max: 4,
      idle_timeout: 30,
      connect_timeout: 12,
      prepare: false,
    });
  }
  return directSql;
}

function errShape(message: string): BillingRpcError {
  return { message };
}

/**
 * Ensure entitlement row exists.
 *
 * Order:
 * 1. Direct Postgres `INSERT ... ON CONFLICT DO NOTHING` (no `public.ensure_entitlement` RPC required).
 * 2. PostgREST `public.ensure_entitlement` when wrappers exist.
 * 3. REST upsert on `isendai.entitlements` when **Settings → API → Exposed schemas** includes `isendai`.
 */
export async function billingEnsureEntitlement(
  admin: SupabaseClient,
  params: {
    p_owner_type: string;
    p_owner_id: string;
    p_default_credits: number;
    p_default_max_versions: number;
  }
): Promise<{ error: BillingRpcError | null }> {
  const sql = getDirectSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO isendai.entitlements (owner_type, owner_id, credits_balance, max_versions_per_request)
        VALUES (
          ${params.p_owner_type},
          ${params.p_owner_id},
          ${params.p_default_credits},
          ${params.p_default_max_versions}
        )
        ON CONFLICT (owner_type, owner_id) DO NOTHING
      `;
      return { error: null };
    } catch (e) {
      console.warn("[billing] direct INSERT entitlements failed, trying PostgREST:", e);
    }
  }

  const rpc = await admin.rpc("ensure_entitlement", params);
  if (!rpc.error) return { error: null };

  try {
    const { error: upErr } = await admin.schema("isendai").from("entitlements").upsert(
      {
        owner_type: params.p_owner_type,
        owner_id: params.p_owner_id,
        credits_balance: params.p_default_credits,
        max_versions_per_request: params.p_default_max_versions,
      },
      { onConflict: "owner_type,owner_id", ignoreDuplicates: true }
    );
    if (!upErr) return { error: null };
    const um = String(upErr.message || "").toLowerCase();
    if (um.includes("invalid schema") || um.includes("does not exist")) {
      return { error: errShape(rpc.error.message) };
    }
    return { error: errShape(upErr.message) };
  } catch {
    return { error: errShape(rpc.error.message) };
  }
}

export async function billingAddCredits(
  admin: SupabaseClient,
  params: { p_owner_type: string; p_owner_id: string; p_amount: number }
): Promise<{ data: number | null; error: BillingRpcError | null }> {
  const sql = getDirectSql();
  if (sql) {
    try {
      const rows = await sql<{ balance: number }[]>`
        SELECT isendai.add_credits(
          ${params.p_owner_type},
          ${params.p_owner_id},
          ${params.p_amount}
        ) AS balance
      `;
      const balance = rows[0]?.balance;
      if (balance !== undefined && balance !== null) {
        return { data: Number(balance), error: null };
      }
    } catch (e) {
      console.warn("[billing] direct add_credits failed, trying PostgREST:", e);
    }
  }

  const { data, error } = await admin.rpc("add_credits", params);
  return {
    data: data !== undefined && data !== null ? Number(data) : null,
    error: error ? errShape(error.message) : null,
  };
}

export async function billingChargeAndCreateRequest(
  admin: SupabaseClient,
  params: {
    p_owner_type: string;
    p_owner_id: string;
    p_tool_id: string;
    p_model_id: string;
    p_input_json: Record<string, unknown>;
    p_price_paid_usd: number | null;
  }
): Promise<{ data: string | null; error: BillingRpcError | null }> {
  const sql = getDirectSql();
  if (sql) {
    try {
      const jsonPayload = JSON.parse(JSON.stringify(params.p_input_json)) as JSONValue;
      const rows = await sql<{ request_id: string }[]>`
        SELECT isendai.charge_and_create_request(
          ${params.p_owner_type},
          ${params.p_owner_id},
          ${params.p_tool_id},
          ${params.p_model_id},
          ${sql.json(jsonPayload)},
          ${params.p_price_paid_usd}
        ) AS request_id
      `;
      const id = rows[0]?.request_id;
      if (id) return { data: String(id), error: null };
    } catch (e) {
      console.warn("[billing] direct charge_and_create_request failed, trying PostgREST:", e);
    }
  }

  const { data, error } = await admin.rpc("charge_and_create_request", params);
  return {
    data: data !== undefined && data !== null ? String(data) : null,
    error: error ? errShape(error.message) : null,
  };
}

export async function billingAddRequestVersion(
  admin: SupabaseClient,
  params: { p_request_id: string; p_text: string }
): Promise<{ data: number | null; error: BillingRpcError | null }> {
  const sql = getDirectSql();
  if (sql) {
    try {
      const rows = await sql<{ idx: number }[]>`
        SELECT isendai.add_request_version(
          ${params.p_request_id},
          ${params.p_text}
        ) AS idx
      `;
      const idx = rows[0]?.idx;
      if (idx !== undefined && idx !== null) {
        return { data: Number(idx), error: null };
      }
    } catch (e) {
      console.warn("[billing] direct add_request_version failed, trying PostgREST:", e);
    }
  }

  const { data, error } = await admin.rpc("add_request_version", params);
  return {
    data: data !== undefined && data !== null ? Number(data) : null,
    error: error ? errShape(error.message) : null,
  };
}
