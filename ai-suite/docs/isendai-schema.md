# isendai schema (Supabase)

The Next.js app expects schema `isendai` with tables `entitlements`, `requests`, and `request_versions`, plus RPCs:

- `ensure_entitlement(p_owner_type, p_owner_id, p_default_credits, p_default_max_versions)`
- `add_credits(p_owner_type, p_owner_id, p_amount)` → returns new balance
- `charge_and_create_request(p_owner_type, p_owner_id, p_tool_id, p_model_id, p_input_json, p_price_paid_usd, p_credit_cost)` → returns new `requests.id` (`p_credit_cost` defaults to `1`)
- `deduct_credits(p_owner_type, p_owner_id, p_amount)` → new balance (extra versions)
- `set_credits_balance(p_owner_type, p_owner_id, p_balance)` → void (admin / webhooks)
- `add_request_version(p_request_id, p_text)` → returns version `idx`
- **`public.user_entitlement_wallet()`** (no args) → current user’s `isendai.entitlements` row (JWT `auth.uid()`). Apply `supabase/APPLY_USER_WALLET_RPC.sql` or migration `20260515120000_user_entitlement_wallet_rpc.sql`. If PostgREST says it is missing from the **schema cache**, run `NOTIFY pgrst, 'reload schema';` in SQL Editor or wait ~1 minute.

### Quick fix (recommended): one SQL file

If you see **`Could not find the function public.charge_and_create_request`** (often mentioning **`p_credit_cost`**), PostgREST does not have a matching RPC: either billing SQL was never applied, or you still have the **old 6-argument** function while the app calls the **7-argument** version.

1. Open **Supabase Dashboard → SQL Editor**.
2. **New project / first install:** paste **`supabase/APPLY_BILLING_ONCE.sql`** and **Run**.
3. **Already ran an old `APPLY_BILLING_ONCE` (6 args):** paste **`supabase/APPLY_VARIABLE_CREDITS_RPC.sql`** (or migration **`20260514100000_isendai_variable_credits_and_billing_meta.sql`**) and **Run**.
4. Wait ~10 seconds, then retry the app (PostgREST reloads its schema cache).

`APPLY_BILLING_ONCE.sql` creates the **`isendai`** tables/RPCs **and** the **`public`** wrapper functions the Next.js app calls via `admin.rpc(...)`.

**Still seeing PostgREST “schema cache” errors after applying SQL?** Add **`SUPABASE_DATABASE_URL`** or **`DIRECT_POSTGRES_URL`** in `.env.local` (Supabase Dashboard → **Database** → **Connection string** → URI). Server billing code will call **`isendai.*` functions over Postgres directly**, bypassing the API layer.

### Or: migrations via CLI

Apply migrations **in order**:

1. `supabase/migrations/20260512000000_isendai_core.sql`
2. `supabase/migrations/20260512100000_isendai_public_rpc_wrappers.sql`
3. `supabase/migrations/20260513120000_lemon_processed_orders.sql` (optional, Lemon idempotency)
4. `supabase/migrations/20260514100000_isendai_variable_credits_and_billing_meta.sql` (**required** for current `billingChargeAndCreateRequest` / variable credits)
5. `supabase/migrations/20260515120000_user_entitlement_wallet_rpc.sql` (**recommended** for `/api/me/wallet` and nav credits without relying only on service-role table reads)

```bash
cd ai-suite && supabase db push
```

The app calls **`admin.rpc("charge_and_create_request", …)`** on the **`public`** schema (no `.schema("isendai")`), because hosted Supabase often does **not** expose custom schemas to PostgREST unless you add **`isendai`** under **Project Settings → API → Exposed schemas**.

For **`.schema("isendai").from(...)`** in dev/topup/claim, add **`isendai`** to **Exposed schemas** or adjust those reads.

The migration enables RLS without policies so **only the service role** (used by server routes with `SUPABASE_SERVICE_ROLE_KEY`) can read/write. The browser anon key must not expose direct table access for these tables.
