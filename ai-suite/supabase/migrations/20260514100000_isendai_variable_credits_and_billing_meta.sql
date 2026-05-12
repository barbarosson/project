-- Variable credit charges, billing metadata, webhook idempotency, trial abuse guard.

ALTER TABLE isendai.entitlements
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS monthly_credit_allowance integer;

CREATE TABLE IF NOT EXISTS isendai.lemon_webhook_events (
  event_key text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS isendai.trial_abuse_guard (
  fingerprint text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE isendai.lemon_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE isendai.trial_abuse_guard ENABLE ROW LEVEL SECURITY;

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

GRANT EXECUTE ON FUNCTION public.charge_and_create_request(text, text, text, text, jsonb, numeric, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_credits_balance(text, text, integer) TO service_role;

GRANT EXECUTE ON FUNCTION public.charge_and_create_request(text, text, text, text, jsonb, numeric, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.deduct_credits(text, text, integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.set_credits_balance(text, text, integer) TO postgres;

NOTIFY pgrst, 'reload schema';
