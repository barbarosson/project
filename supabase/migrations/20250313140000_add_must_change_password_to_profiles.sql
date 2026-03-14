-- Sifre sifirlama: kullanici ilk giriste sifre degistirmek zorunda kalsin
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS 'True when admin reset password with temp code; user must set new password on next login';
