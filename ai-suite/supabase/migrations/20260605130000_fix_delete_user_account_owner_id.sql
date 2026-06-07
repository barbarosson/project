-- Fix owner_id type mismatch (uuid vs text) when purging user data.

CREATE OR REPLACE FUNCTION isendai.delete_user_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_owner_text text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'missing_user_id';
  END IF;

  v_owner_text := p_user_id::text;

  DELETE FROM isendai.ai_feedback
  WHERE owner_type = 'user' AND owner_id::text = v_owner_text;

  DELETE FROM isendai.requests
  WHERE owner_type = 'user' AND owner_id::text = v_owner_text;

  DELETE FROM isendai.lemon_processed_orders
  WHERE owner_type = 'user' AND owner_id::text = v_owner_text;

  DELETE FROM isendai.welcome_bonus_grants
  WHERE user_id = p_user_id;

  DELETE FROM isendai.referral_signup_attribution
  WHERE user_id = p_user_id;

  DELETE FROM isendai.referral_reward_grants
  WHERE referee_user_id = p_user_id OR referrer_user_id = p_user_id;

  DELETE FROM isendai.referral_profiles
  WHERE user_id = p_user_id;

  DELETE FROM isendai.entitlements
  WHERE owner_type = 'user' AND owner_id::text = v_owner_text;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account_data(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
  SELECT isendai.delete_user_account_data(p_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account_data(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(uuid) TO postgres;
