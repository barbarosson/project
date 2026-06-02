-- Referral program: profiles + idempotent reward grants (service_role only).

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
