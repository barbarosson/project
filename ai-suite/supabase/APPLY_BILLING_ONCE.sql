-- ============================================================================
-- Run this entire file once in Supabase Dashboard → SQL Editor → Run
-- Fixes: "Could not find the function public.charge_and_create_request ..."
-- After run, wait ~10s or retry the app (PostgREST reloads schema).
--
-- Includes `p_credit_cost` (7-arg RPC) required by current ai-suite
-- (`billingChargeAndCreateRequest`). If you already ran an older copy of this
-- file (6-arg only), run instead: `migrations/20260514100000_isendai_variable_credits_and_billing_meta.sql`
-- or `APPLY_VARIABLE_CREDITS_RPC.sql`.
-- ============================================================================

-- Part A: schema + tables + isendai.* RPCs
CREATE SCHEMA IF NOT EXISTS isendai;

CREATE TABLE IF NOT EXISTS isendai.entitlements (
  owner_type text NOT NULL CHECK (owner_type IN ('user', 'anon')),
  owner_id text NOT NULL,
  credits_balance integer NOT NULL DEFAULT 0,
  max_versions_per_request integer NOT NULL DEFAULT 2,
  plan_id text,
  plan_status text,
  current_period_end timestamptz,
  PRIMARY KEY (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS isendai.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('user', 'anon')),
  owner_id text NOT NULL,
  tool_id text NOT NULL,
  model_id text NOT NULL,
  input_json jsonb NOT NULL,
  credits_charged integer NOT NULL DEFAULT 1,
  max_versions integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS requests_owner_idx ON isendai.requests (owner_type, owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS isendai.request_versions (
  request_id uuid NOT NULL REFERENCES isendai.requests (id) ON DELETE CASCADE,
  idx integer NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, idx)
);

ALTER TABLE isendai.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE isendai.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE isendai.request_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION isendai.ensure_entitlement(
  p_owner_type text,
  p_owner_id text,
  p_default_credits integer,
  p_default_max_versions integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
BEGIN
  INSERT INTO isendai.entitlements (owner_type, owner_id, credits_balance, max_versions_per_request)
  VALUES (p_owner_type, p_owner_id, p_default_credits, p_default_max_versions)
  ON CONFLICT (owner_type, owner_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION isendai.add_credits(
  p_owner_type text,
  p_owner_id text,
  p_amount integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  UPDATE isendai.entitlements
  SET credits_balance = credits_balance + p_amount
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'entitlement_not_found';
  END IF;

  RETURN new_balance;
END;
$$;

DROP FUNCTION IF EXISTS public.charge_and_create_request(text, text, text, text, jsonb, numeric);
DROP FUNCTION IF EXISTS isendai.charge_and_create_request(text, text, text, text, jsonb, numeric);

CREATE OR REPLACE FUNCTION isendai.charge_and_create_request(
  p_owner_type text,
  p_owner_id text,
  p_tool_id text,
  p_model_id text,
  p_input_json jsonb,
  p_price_paid_usd numeric,
  p_credit_cost integer DEFAULT 1
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  rid uuid;
  bal integer;
  maxv integer;
  cost integer;
BEGIN
  cost := COALESCE(p_credit_cost, 1);
  IF cost < 1 THEN
    RAISE EXCEPTION 'invalid_credit_cost';
  END IF;

  SELECT credits_balance, max_versions_per_request
  INTO bal, maxv
  FROM isendai.entitlements
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  IF bal < cost THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  UPDATE isendai.entitlements
  SET credits_balance = credits_balance - cost
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id;

  INSERT INTO isendai.requests (
    owner_type, owner_id, tool_id, model_id, input_json, credits_charged, max_versions
  )
  VALUES (
    p_owner_type, p_owner_id, p_tool_id, p_model_id, p_input_json, cost, maxv
  )
  RETURNING id INTO rid;

  RETURN rid;
END;
$$;

CREATE OR REPLACE FUNCTION isendai.deduct_credits(
  p_owner_type text,
  p_owner_id text,
  p_amount integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  UPDATE isendai.entitlements
  SET credits_balance = credits_balance - p_amount
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION isendai.set_credits_balance(
  p_owner_type text,
  p_owner_id text,
  p_balance integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
BEGIN
  IF p_balance IS NULL OR p_balance < 0 THEN
    RAISE EXCEPTION 'invalid_balance';
  END IF;

  UPDATE isendai.entitlements
  SET credits_balance = p_balance
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'entitlement_not_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION isendai.add_request_version(
  p_request_id uuid,
  p_text text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  max_allowed integer;
  current_max integer;
  next_idx integer;
BEGIN
  SELECT max_versions INTO max_allowed
  FROM isendai.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  SELECT COALESCE(MAX(idx), 0) INTO current_max
  FROM isendai.request_versions
  WHERE request_id = p_request_id;

  IF current_max >= max_allowed THEN
    RAISE EXCEPTION 'version_limit_reached';
  END IF;

  next_idx := current_max + 1;

  INSERT INTO isendai.request_versions (request_id, idx, text)
  VALUES (p_request_id, next_idx, p_text);

  RETURN next_idx;
END;
$$;

GRANT USAGE ON SCHEMA isendai TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA isendai TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA isendai TO service_role;

-- Part B: public wrappers (what supabase-js PostgREST hits by default)
CREATE OR REPLACE FUNCTION public.ensure_entitlement(
  p_owner_type text,
  p_owner_id text,
  p_default_credits integer,
  p_default_max_versions integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
BEGIN
  PERFORM isendai.ensure_entitlement(
    p_owner_type,
    p_owner_id,
    p_default_credits,
    p_default_max_versions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_credits(
  p_owner_type text,
  p_owner_id text,
  p_amount integer
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.add_credits(p_owner_type, p_owner_id, p_amount);
$$;

CREATE OR REPLACE FUNCTION public.charge_and_create_request(
  p_owner_type text,
  p_owner_id text,
  p_tool_id text,
  p_model_id text,
  p_input_json jsonb,
  p_price_paid_usd numeric,
  p_credit_cost integer DEFAULT 1
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.charge_and_create_request(
    p_owner_type,
    p_owner_id,
    p_tool_id,
    p_model_id,
    p_input_json,
    p_price_paid_usd,
    p_credit_cost
  );
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_owner_type text,
  p_owner_id text,
  p_amount integer
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.deduct_credits(p_owner_type, p_owner_id, p_amount);
$$;

CREATE OR REPLACE FUNCTION public.set_credits_balance(
  p_owner_type text,
  p_owner_id text,
  p_balance integer
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.set_credits_balance(p_owner_type, p_owner_id, p_balance);
$$;

CREATE OR REPLACE FUNCTION public.add_request_version(
  p_request_id uuid,
  p_text text
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.add_request_version(p_request_id, p_text);
$$;

-- PostgREST lists RPCs executable by these roles (service_role calls still go through API)
GRANT EXECUTE ON FUNCTION public.ensure_entitlement(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_credits(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.charge_and_create_request(text, text, text, text, jsonb, numeric, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_credits_balance(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_request_version(uuid, text) TO service_role;

-- Optional: helps some PostgREST builds expose RPCs to introspection
GRANT EXECUTE ON FUNCTION public.ensure_entitlement(text, text, integer, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.add_credits(text, text, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.charge_and_create_request(text, text, text, text, jsonb, numeric, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.deduct_credits(text, text, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.set_credits_balance(text, text, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.add_request_version(uuid, text) TO postgres;

-- Ask PostgREST to reload (hosted Supabase)
NOTIFY pgrst, 'reload schema';
