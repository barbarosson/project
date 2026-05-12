-- PostgREST / supabase-js resolves rpc("fn") to functions in `public` by default.
-- Core logic lives in `isendai`; these thin wrappers unblock admin.rpc(...) calls.

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
  p_price_paid_usd numeric
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
    p_price_paid_usd
  );
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

GRANT EXECUTE ON FUNCTION public.ensure_entitlement(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_credits(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.charge_and_create_request(text, text, text, text, jsonb, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_request_version(uuid, text) TO service_role;
