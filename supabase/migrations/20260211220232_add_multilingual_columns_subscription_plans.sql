/*
  # Subscription Plans Çoklu Dil Desteği

  1. Yeni Kolonlar
    - `name_en` (text) - İngilizce plan adı
    - `description_en` (text) - İngilizce açıklama
    - `description_tr` (text) - Türkçe açıklama

  2. Güncelleme
    - Mevcut name değerlerini name_en olarak ayarla
*/

-- name_en kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'name_en'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN name_en text;
  END IF;
END $$;

-- description_en kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN description_en text;
  END IF;
END $$;

-- description_tr kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'description_tr'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN description_tr text;
  END IF;
END $$;

-- Mevcut name değerlerini name_en'e kopyala (İngilizce plan isimleri için)
UPDATE subscription_plans 
SET name_en = name 
WHERE name_en IS NULL AND name IS NOT NULL;

-- Plan isimlerini düzelt (Türkçe planlar için İngilizce karşılık ekle)
UPDATE subscription_plans SET name_en = 'Basic' WHERE plan_tier = 'basic' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'Professional' WHERE plan_tier = 'professional' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'Business' WHERE plan_tier = 'business' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'Enterprise' WHERE plan_tier = 'enterprise' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'Premium' WHERE plan_tier = 'premium' AND name_en IS NULL;
