-- Public RPC wrappers for referral profiles (no PostgREST "isendai" schema exposure required).

CREATE OR REPLACE FUNCTION isendai.ensure_referral_profile(
  p_user_id uuid,
  p_referred_by_code text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  referral_code text,
  referred_by_code text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  v_row isendai.referral_profiles%ROWTYPE;
  v_safe_ref text;
  v_code text;
  v_attempt integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row FROM isendai.referral_profiles rp WHERE rp.user_id = p_user_id;
  IF FOUND THEN
    user_id := v_row.user_id;
    referral_code := v_row.referral_code;
    referred_by_code := v_row.referred_by_code;
    created_at := v_row.created_at;
    RETURN NEXT;
    RETURN;
  END IF;

  IF p_referred_by_code IS NOT NULL AND length(trim(p_referred_by_code)) > 0 THEN
    v_safe_ref := upper(regexp_replace(trim(p_referred_by_code), '[^A-Z0-9]', '', 'g'));
    IF char_length(v_safe_ref) < 6 THEN
      v_safe_ref := NULL;
    ELSIF NOT EXISTS (
      SELECT 1 FROM isendai.referral_profiles WHERE referral_code = v_safe_ref
    ) THEN
      v_safe_ref := NULL;
    END IF;
  ELSE
    v_safe_ref := NULL;
  END IF;

  FOR v_attempt IN 1..20 LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO isendai.referral_profiles (user_id, referral_code, referred_by_code)
      VALUES (p_user_id, v_code, v_safe_ref)
      RETURNING
        isendai.referral_profiles.user_id,
        isendai.referral_profiles.referral_code,
        isendai.referral_profiles.referred_by_code,
        isendai.referral_profiles.created_at
      INTO user_id, referral_code, referred_by_code, created_at;
      RETURN NEXT;
      RETURN;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT * INTO v_row FROM isendai.referral_profiles rp WHERE rp.user_id = p_user_id;
        IF FOUND THEN
          user_id := v_row.user_id;
          referral_code := v_row.referral_code;
          referred_by_code := v_row.referred_by_code;
          created_at := v_row.created_at;
          RETURN NEXT;
          RETURN;
        END IF;
    END;
  END LOOP;

  RAISE EXCEPTION 'referral_code_allocation_failed';
END;
$$;

CREATE OR REPLACE FUNCTION isendai.get_referral_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  v_code text;
  v_friends integer;
  v_credits integer;
BEGIN
  SELECT rp.referral_code INTO v_code
  FROM isendai.referral_profiles rp
  WHERE rp.user_id = p_user_id;

  IF v_code IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT count(*)::integer INTO v_friends
  FROM isendai.referral_profiles
  WHERE referred_by_code = v_code;

  SELECT coalesce(sum(credits_tenths_each), 0)::integer INTO v_credits
  FROM isendai.referral_reward_grants
  WHERE referrer_user_id = p_user_id
    AND status = 'granted';

  RETURN jsonb_build_object(
    'referral_code', v_code,
    'friends_invited', v_friends,
    'credits_earned_tenths', v_credits
  );
END;
$$;

CREATE OR REPLACE FUNCTION isendai.upsert_referral_attribution(
  p_user_id uuid,
  p_referred_by_code text,
  p_ip_address text,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
BEGIN
  INSERT INTO isendai.referral_signup_attribution (
    user_id, referred_by_code, ip_address, device_fingerprint
  )
  VALUES (p_user_id, p_referred_by_code, p_ip_address, p_device_fingerprint)
  ON CONFLICT (user_id) DO UPDATE SET
    referred_by_code = EXCLUDED.referred_by_code,
    ip_address = EXCLUDED.ip_address,
    device_fingerprint = EXCLUDED.device_fingerprint;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_referral_profile(
  p_user_id uuid,
  p_referred_by_code text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  referral_code text,
  referred_by_code text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT * FROM isendai.ensure_referral_profile(p_user_id, p_referred_by_code);
$$;

CREATE OR REPLACE FUNCTION public.get_referral_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.get_referral_dashboard_stats(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.upsert_referral_attribution(
  p_user_id uuid,
  p_referred_by_code text,
  p_ip_address text,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.upsert_referral_attribution(
    p_user_id, p_referred_by_code, p_ip_address, p_device_fingerprint
  );
$$;

GRANT EXECUTE ON FUNCTION public.ensure_referral_profile(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_dashboard_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_referral_attribution(uuid, text, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.ensure_referral_profile(uuid, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.get_referral_dashboard_stats(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.upsert_referral_attribution(uuid, text, text, text) TO postgres;

NOTIFY pgrst, 'reload schema';
