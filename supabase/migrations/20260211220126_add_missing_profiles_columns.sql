/*
  # Profiles Tablosuna Eksik Kolonları Ekle

  1. Yeni Kolonlar
    - `is_super_admin` (boolean) - Super admin yetkisi
    - `user_status` (text) - Kullanıcı durumu (active, suspended, pending)
    - `language` (text) - Tercih edilen dil (tr, en)
    - `timezone` (text) - Saat dilimi
    - `last_login_at` (timestamptz) - Son giriş zamanı
    - `onboarding_completed` (boolean) - Onboarding tamamlandı mı
    - `preferences` (jsonb) - Kullanıcı tercihleri
    - `permissions` (jsonb) - Özel yetkiler

  2. Güvenlik
    - Varsayılan değerler eklendi
    - Gerekli indexler oluşturuldu
*/

-- is_super_admin kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- user_status kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_status text DEFAULT 'active' CHECK (user_status IN ('active', 'suspended', 'pending', 'inactive'));
  END IF;
END $$;

-- language kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'tr' CHECK (language IN ('tr', 'en'));
  END IF;
END $$;

-- timezone kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone text DEFAULT 'Europe/Istanbul';
  END IF;
END $$;

-- last_login_at kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- onboarding_completed kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- preferences kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- permissions kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Indexler oluştur
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_user_status ON profiles(user_status);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);
