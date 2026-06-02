-- Referral anti-fraud: server-side rewards on email verification, IP limits, RLS.
--
-- CREDITS SCHEMA (Scenario 2 — separate wallet table, NOT auth.users / profiles):
--   Table:  isendai.entitlements
--   Key:    (owner_type, owner_id)  —  owner_type = 'user', owner_id = auth user UUID (text)
--   Column: credits_balance (integer tenths; 50 display credits = +500 via isendai.add_credits)
--   Referrer link: isendai.referral_profiles.referred_by_code → referral_code of referrer
--
-- Rewards run only after auth.users.email_confirmed_at is set (magic link / OAuth verify).

-- Prerequisite tables (from 20260602170000 — safe if you already ran that migration).
CREATE TABLE IF NOT EXISTS isendai.referral_profiles (
  user_id uuid PRIMARY KEY,
  referral_code text NOT NULL,
  referred_by_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_profiles_code_len CHECK (char_length(referral_code) >= 6),
  CONSTRAINT referral_profiles_code_format CHECK (referral_code ~ '^[A-Z0-9]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_profiles_code_uidx
  ON isendai.referral_profiles (referral_code);

CREATE INDEX IF NOT EXISTS referral_profiles_referred_by_idx
  ON isendai.referral_profiles (referred_by_code)
  WHERE referred_by_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS isendai.referral_reward_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_user_id uuid NOT NULL UNIQUE,
  referrer_user_id uuid NOT NULL,
  credits_tenths_each integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_reward_grants_referrer_idx
  ON isendai.referral_reward_grants (referrer_user_id, created_at DESC);

ALTER TABLE isendai.referral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE isendai.referral_reward_grants ENABLE ROW LEVEL SECURITY;

-- 50 whole credits = 500 tenths (matches app creditsToTenths(50))
ALTER TABLE isendai.referral_reward_grants
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'granted',
  ADD COLUMN IF NOT EXISTS block_reason text;

ALTER TABLE isendai.referral_reward_grants
  DROP CONSTRAINT IF EXISTS referral_reward_grants_status_check;

ALTER TABLE isendai.referral_reward_grants
  ADD CONSTRAINT referral_reward_grants_status_check
  CHECK (status IN ('granted', 'blocked_ip_fraud', 'blocked_self_referral', 'blocked_no_referrer'));

-- Signup attribution (IP / device) — written by server before verification; trigger reads it.
CREATE TABLE IF NOT EXISTS isendai.referral_signup_attribution (
  user_id uuid PRIMARY KEY,
  referred_by_code text NOT NULL,
  ip_address text NOT NULL,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_attribution_code_format CHECK (referred_by_code ~ '^[A-Z0-9]+$')
);

CREATE INDEX IF NOT EXISTS referral_attribution_ip_ref_idx
  ON isendai.referral_signup_attribution (referred_by_code, ip_address, created_at DESC);

ALTER TABLE isendai.referral_signup_attribution ENABLE ROW LEVEL SECURITY;

-- Max other signups from same IP + referrer in 24h before blocking (3rd+ signup blocked).
CREATE OR REPLACE FUNCTION isendai.referral_ip_fraud_exceeded(
  p_referee_user_id uuid,
  p_referred_by_code text,
  p_ip_address text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_ip_address IS NULL OR length(trim(p_ip_address)) = 0 THEN
    RETURN true;
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM isendai.referral_signup_attribution a
  WHERE a.referred_by_code = p_referred_by_code
    AND a.ip_address = p_ip_address
    AND a.created_at > now() - interval '24 hours'
    AND a.user_id <> p_referee_user_id;

  RETURN v_count >= 2;
END;
$$;

-- Bootstrap referral_profiles from auth.users metadata (runs before reward processing).
CREATE OR REPLACE FUNCTION isendai.ensure_referral_profile_from_auth(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_meta_code text;
  v_referred_by text;
  v_referral_code text;
  v_attempt integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM isendai.referral_profiles WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  SELECT coalesce(
    nullif(trim(raw_user_meta_data->>'referred_by'), ''),
    nullif(trim(raw_user_meta_data->>'referral_code_invited_by'), '')
  )
  INTO v_meta_code
  FROM auth.users
  WHERE id = p_user_id;

  IF v_meta_code IS NOT NULL THEN
    v_referred_by := upper(regexp_replace(v_meta_code, '[^A-Z0-9]', '', 'g'));
    IF char_length(v_referred_by) < 6 THEN
      v_referred_by := NULL;
    ELSIF NOT EXISTS (
      SELECT 1 FROM isendai.referral_profiles WHERE referral_code = v_referred_by
    ) THEN
      v_referred_by := NULL;
    END IF;
  END IF;

  FOR v_attempt IN 1..16 LOOP
    v_referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO isendai.referral_profiles (user_id, referral_code, referred_by_code)
      VALUES (p_user_id, v_referral_code, v_referred_by);
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      IF EXISTS (SELECT 1 FROM isendai.referral_profiles WHERE user_id = p_user_id) THEN
        RETURN;
      END IF;
    END;
  END LOOP;
END;
$$;

-- Award referral credits only when email is verified (DB trigger + optional RPC retry).
CREATE OR REPLACE FUNCTION isendai.process_referral_rewards_for_user(p_referee_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
DECLARE
  v_referred_by_code text;
  v_referrer_user_id uuid;
  v_ip text;
  v_email_confirmed timestamptz;
  v_bonus integer := 500;
BEGIN
  IF p_referee_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email_confirmed_at INTO v_email_confirmed
  FROM auth.users
  WHERE id = p_referee_user_id;

  IF v_email_confirmed IS NULL THEN
    RETURN;
  END IF;

  -- Idempotent: one grant row per referee (including permanent blocks).
  IF EXISTS (
    SELECT 1 FROM isendai.referral_reward_grants g
    WHERE g.referee_user_id = p_referee_user_id
  ) THEN
    RETURN;
  END IF;

  PERFORM isendai.ensure_referral_profile_from_auth(p_referee_user_id);

  SELECT rp.referred_by_code INTO v_referred_by_code
  FROM isendai.referral_profiles rp
  WHERE rp.user_id = p_referee_user_id;

  IF v_referred_by_code IS NULL OR length(trim(v_referred_by_code)) = 0 THEN
    INSERT INTO isendai.referral_reward_grants (
      referee_user_id, referrer_user_id, credits_tenths_each, status, block_reason
    ) VALUES (
      p_referee_user_id, p_referee_user_id, 0, 'blocked_no_referrer', 'no_referrer_code'
    );
    RETURN;
  END IF;

  SELECT rp.user_id INTO v_referrer_user_id
  FROM isendai.referral_profiles rp
  WHERE rp.referral_code = v_referred_by_code;

  IF v_referrer_user_id IS NULL THEN
    INSERT INTO isendai.referral_reward_grants (
      referee_user_id, referrer_user_id, credits_tenths_each, status, block_reason
    ) VALUES (
      p_referee_user_id, p_referee_user_id, 0, 'blocked_no_referrer', 'referrer_not_found'
    );
    RETURN;
  END IF;

  IF v_referrer_user_id = p_referee_user_id THEN
    INSERT INTO isendai.referral_reward_grants (
      referee_user_id, referrer_user_id, credits_tenths_each, status, block_reason
    ) VALUES (
      p_referee_user_id, v_referrer_user_id, 0, 'blocked_self_referral', 'self_referral'
    );
    RETURN;
  END IF;

  SELECT a.ip_address INTO v_ip
  FROM isendai.referral_signup_attribution a
  WHERE a.user_id = p_referee_user_id;

  -- Attribution may arrive after verify (auth callback); retry via attribution trigger.
  IF v_ip IS NULL OR length(trim(v_ip)) = 0 THEN
    RETURN;
  END IF;

  IF isendai.referral_ip_fraud_exceeded(p_referee_user_id, v_referred_by_code, v_ip) THEN
    INSERT INTO isendai.referral_reward_grants (
      referee_user_id, referrer_user_id, credits_tenths_each, status, block_reason
    ) VALUES (
      p_referee_user_id,
      v_referrer_user_id,
      0,
      'blocked_ip_fraud',
      'ip_limit_exceeded:' || v_ip
    );
    RETURN;
  END IF;

  PERFORM isendai.ensure_entitlement('user', v_referrer_user_id::text, 0, 9999);
  PERFORM isendai.ensure_entitlement('user', p_referee_user_id::text, 0, 9999);

  INSERT INTO isendai.referral_reward_grants (
    referee_user_id, referrer_user_id, credits_tenths_each, status, block_reason
  ) VALUES (
    p_referee_user_id, v_referrer_user_id, v_bonus, 'granted', NULL
  );

  PERFORM isendai.add_credits('user', v_referrer_user_id::text, v_bonus);
  PERFORM isendai.add_credits('user', p_referee_user_id::text, v_bonus);
END;
$$;

-- Fire when email becomes verified (magic link / confirm) or OAuth instant verify on insert.
CREATE OR REPLACE FUNCTION isendai.on_auth_user_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public, auth
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
  ELSIF TG_OP = 'UPDATE'
    AND OLD.email_confirmed_at IS NULL
    AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM isendai.process_referral_rewards_for_user(NEW.id);
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

-- RLS: read-only wallet/referral data for authenticated users; no client credit writes.
DROP POLICY IF EXISTS entitlements_select_own ON isendai.entitlements;
CREATE POLICY entitlements_select_own ON isendai.entitlements
  FOR SELECT
  TO authenticated
  USING (owner_type = 'user' AND owner_id = (auth.uid())::text);

DROP POLICY IF EXISTS referral_profiles_select_own ON isendai.referral_profiles;
CREATE POLICY referral_profiles_select_own ON isendai.referral_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_grants_select_involved ON isendai.referral_reward_grants;
CREATE POLICY referral_grants_select_involved ON isendai.referral_reward_grants
  FOR SELECT
  TO authenticated
  USING (referrer_user_id = auth.uid() OR referee_user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies on entitlements, referral tables, or attribution (service_role / triggers only).

REVOKE ALL ON TABLE isendai.referral_signup_attribution FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE isendai.entitlements FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE isendai.referral_profiles FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE isendai.referral_reward_grants FROM authenticated, anon;
GRANT USAGE ON SCHEMA isendai TO authenticated;
GRANT SELECT ON TABLE isendai.entitlements TO authenticated;
GRANT SELECT ON TABLE isendai.referral_profiles TO authenticated;
GRANT SELECT ON TABLE isendai.referral_reward_grants TO authenticated;
