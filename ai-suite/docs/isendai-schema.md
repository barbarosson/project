# isendai schema (Supabase)

The Next.js app expects schema `isendai` with tables `entitlements`, `requests`, and `request_versions`, plus RPCs:

- `ensure_entitlement(p_owner_type, p_owner_id, p_default_credits, p_default_max_versions)`
- `add_credits(p_owner_type, p_owner_id, p_amount)` → returns new balance
- `charge_and_create_request(p_owner_type, p_owner_id, p_tool_id, p_model_id, p_input_json, p_price_paid_usd)` → returns new `requests.id`
- `add_request_version(p_request_id, p_text)` → returns version `idx`

### Quick fix (recommended): one SQL file

If you see **`Could not find the function public.charge_and_create_request`** you have not applied the DB objects on this Supabase project yet.

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste the full contents of **`supabase/APPLY_BILLING_ONCE.sql`** (in this repo under `ai-suite/`) and click **Run**.
3. Wait a few seconds, then retry the app (PostgREST reloads its schema cache).

That file creates the **`isendai`** tables/RPCs **and** the **`public`** wrapper functions the Next.js app calls via `admin.rpc(...)`.

**Still seeing PostgREST “schema cache” errors after applying SQL?** Add **`SUPABASE_DATABASE_URL`** or **`DIRECT_POSTGRES_URL`** in `.env.local` (Supabase Dashboard → **Database** → **Connection string** → URI). Server billing code will call **`isendai.*` functions over Postgres directly**, bypassing the API layer.

### Or: migrations via CLI

Apply migrations **in order**:

1. `supabase/migrations/20260512000000_isendai_core.sql`
2. `supabase/migrations/20260512100000_isendai_public_rpc_wrappers.sql`

```bash
cd ai-suite && supabase db push
```

The app calls **`admin.rpc("charge_and_create_request", …)`** on the **`public`** schema (no `.schema("isendai")`), because hosted Supabase often does **not** expose custom schemas to PostgREST unless you add **`isendai`** under **Project Settings → API → Exposed schemas**.

For **`.schema("isendai").from(...)`** in dev/topup/claim, add **`isendai`** to **Exposed schemas** or adjust those reads.

The migration enables RLS without policies so **only the service role** (used by server routes with `SUPABASE_SERVICE_ROLE_KEY`) can read/write. The browser anon key must not expose direct table access for these tables.
