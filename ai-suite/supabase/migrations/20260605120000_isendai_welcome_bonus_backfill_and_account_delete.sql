-- Welcome bonus: retry on profile completion + backfill eligible users.
-- Account deletion: purge isendai data for a user (auth user removed by app via Admin API).

CREATE OR REPLACE FUNCTION isendai.process_welcome_bonus_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_email_confirmed timestamptz;
  v_profile_completed text;
  v_bonus integer := 1000;
  v_owner_id text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  v_owner_id := p_user_id::text;

  IF EXISTS (
    SELECT 1 FROM isendai.welcome_bonus_grants g WHERE g.user_id = p_user_id
  ) THEN
    RETURN;
  END IF;

  SELECT u.email_confirmed_at, u.raw_user_meta_data->>'profile_completed_at'
  INTO v_email_confirmed, v_profile_completed
  FROM auth.users u
  WHERE u.id = p_user_id;

  IF v_email_confirmed IS NULL THEN
    RETURN;
  END IF;

  IF v_profile_completed IS NULL OR length(trim(v_profile_completed)) = 0 THEN
    RETURN;
  END IF;

  PERFORM isendai.ensure_entitlement('user', v_owner_id, 0, 9999);

  INSERT INTO isendai.welcome_bonus_grants (user_id, credits_tenths, status, block_reason)
  VALUES (p_user_id, v_bonus, 'granted', NULL);

  PERFORM isendai.add_credits('user', v_owner_id, v_bonus);
EXCEPTION
  WHEN unique_violation THEN
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_welcome_bonus_for_user(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
  SELECT isendai.process_welcome_bonus_for_user(p_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.process_welcome_bonus_for_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_welcome_bonus_for_user(uuid) TO postgres;

CREATE OR REPLACE FUNCTION isendai.backfill_welcome_bonus_grants()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_count integer := 0;
BEGIN
  FOR v_user_id IN
    SELECT u.id
    FROM auth.users u
    WHERE u.email_confirmed_at IS NOT NULL
      AND nullif(trim(u.raw_user_meta_data->>'profile_completed_at'), '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM isendai.welcome_bonus_grants g WHERE g.user_id = u.id
      )
  LOOP
    PERFORM isendai.process_welcome_bonus_for_user(v_user_id);
    IF EXISTS (SELECT 1 FROM isendai.welcome_bonus_grants g WHERE g.user_id = v_user_id) THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_welcome_bonus_grants()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
  SELECT isendai.backfill_welcome_bonus_grants();
$$;

GRANT EXECUTE ON FUNCTION public.backfill_welcome_bonus_grants() TO service_role;
GRANT EXECUTE ON FUNCTION public.backfill_welcome_bonus_grants() TO postgres;

-- Grant welcome bonus when email is verified OR membership profile is saved.
CREATE OR REPLACE FUNCTION isendai.on_auth_user_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_profile_now text;
  v_profile_before text;
BEGIN
  v_profile_now := nullif(trim(NEW.raw_user_meta_data->>'profile_completed_at'), '');
  v_profile_before := nullif(trim(OLD.raw_user_meta_data->>'profile_completed_at'), '');

  IF TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  ELSIF TG_OP = 'UPDATE'
    AND OLD.email_confirmed_at IS NULL
    AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.email_confirmed_at IS NOT NULL
    AND v_profile_now IS NOT NULL
    AND v_profile_before IS DISTINCT FROM v_profile_now THEN
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  ELSIF TG_OP = 'INSERT'
    AND NEW.email_confirmed_at IS NOT NULL
    AND v_profile_now IS NOT NULL THEN
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_verified
  AFTER INSERT OR UPDATE OF email_confirmed_at, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION isendai.on_auth_user_email_verified();

CREATE OR REPLACE FUNCTION isendai.delete_user_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_owner_id text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'missing_user_id';
  END IF;

  v_owner_id := p_user_id::text;

  DELETE FROM isendai.ai_feedback
  WHERE owner_type = 'user' AND owner_id = v_owner_id;

  DELETE FROM isendai.requests
  WHERE owner_type = 'user' AND owner_id = v_owner_id;

  DELETE FROM isendai.lemon_processed_orders
  WHERE owner_type = 'user' AND owner_id = v_owner_id;

  DELETE FROM isendai.welcome_bonus_grants
  WHERE user_id = p_user_id;

  DELETE FROM isendai.referral_signup_attribution
  WHERE user_id = p_user_id;

  DELETE FROM isendai.referral_reward_grants
  WHERE referee_user_id = p_user_id OR referrer_user_id = p_user_id;

  DELETE FROM isendai.referral_profiles
  WHERE user_id = p_user_id;

  DELETE FROM isendai.entitlements
  WHERE owner_type = 'user' AND owner_id = v_owner_id;
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

SELECT isendai.backfill_welcome_bonus_grants();
