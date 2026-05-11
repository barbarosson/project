# isendai schema (Supabase)

The Next.js app expects schema `isendai` with tables `entitlements`, `requests`, and `request_versions`, plus RPCs:

- `ensure_entitlement(p_owner_type, p_owner_id, p_default_credits, p_default_max_versions)`
- `add_credits(p_owner_type, p_owner_id, p_amount)` → returns new balance
- `charge_and_create_request(p_owner_type, p_owner_id, p_tool_id, p_model_id, p_input_json, p_price_paid_usd)` → returns new `requests.id`
- `add_request_version(p_request_id, p_text)` → returns version `idx`

Apply the migration in this repo:

`supabase/migrations/20260512000000_isendai_core.sql`

Using Supabase CLI from `ai-suite/` (or paste into the SQL editor):

```bash
supabase db push
```

The migration enables RLS without policies so **only the service role** (used by server routes with `SUPABASE_SERVICE_ROLE_KEY`) can read/write. The browser anon key must not expose direct table access for these tables.
