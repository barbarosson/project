-- One-time welcome bonus: 100 whole credits (1000 tenths) after email verification + membership profile.

CREATE TABLE IF NOT EXISTS isendai.welcome_bonus_grants (
  user_id uuid PRIMARY KEY,
  credits_tenths integer NOT NULL,
  status text NOT NULL DEFAULT 'granted',
  block_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT welcome_bonus_grants_status_chk CHECK (
    status IN ('granted', 'blocked', 'pending')
  )
);

ALTER TABLE isendai.welcome_bonus_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS welcome_bonus_grants_select_own ON isendai.welcome_bonus_grants;
CREATE POLICY welcome_bonus_grants_select_own ON isendai.welcome_bonus_grants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

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

  PERFORM isendai.ensure_entitlement('user', p_user_id::text, 0, 9999);

  INSERT INTO isendai.welcome_bonus_grants (user_id, credits_tenths, status, block_reason)
  VALUES (p_user_id, v_bonus, 'granted', NULL);

  PERFORM isendai.add_credits('user', p_user_id::text, v_bonus);
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

-- Retry welcome bonus when email becomes verified (profile may already be complete).
CREATE OR REPLACE FUNCTION isendai.on_auth_user_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  ELSIF TG_OP = 'UPDATE'
    AND OLD.email_confirmed_at IS NULL
    AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
    PERFORM isendai.process_welcome_bonus_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_verified
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION isendai.on_auth_user_email_verified();
