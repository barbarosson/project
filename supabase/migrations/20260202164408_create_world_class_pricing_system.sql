/*
  # World-Class Pricing System for Modulus ERP

  1. New Tables
    - `pricing_addons`
      - Stores available add-ons for pricing plans
      - Fields: name, description, price, category, is_active
    
    - `pricing_comparisons`
      - Stores competitor comparison data
      - Fields: feature_name, modulus_value, competitor values
    
    - `pricing_trust_badges`
      - Stores trust badges to display on pricing page
      - Fields: title, description, icon, display_order

  2. Updates to Existing Tables
    - Enhance `subscription_plans` with new fields for better pricing display
    - Add fields: plan_tier, recommended, trial_days, addon_support

  3. Security
    - Enable RLS on all new tables
    - Add policies for public read access (anonymous users can view pricing)
    - Add policies for authenticated admin write access

  4. Seed Data
    - Add default add-ons (Marketplace Sync, Advanced HR, etc.)
    - Add competitor comparison data (vs. Isbasi, BizimHesap)
    - Add trust badges (Supabase, Next.js, etc.)
*/

-- Add new columns to subscription_plans if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'plan_tier'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN plan_tier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'recommended'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN recommended boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'trial_days'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN trial_days integer DEFAULT 14;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'addon_support'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN addon_support boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'price_usd'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN price_usd integer;
  END IF;
END $$;

-- Create pricing_addons table
CREATE TABLE IF NOT EXISTS pricing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_tr text NOT NULL,
  description_en text NOT NULL,
  description_tr text NOT NULL,
  price_tl integer NOT NULL,
  price_usd integer NOT NULL,
  category text NOT NULL,
  icon text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_addons ENABLE ROW LEVEL SECURITY;

-- Create pricing_comparisons table
CREATE TABLE IF NOT EXISTS pricing_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name_en text NOT NULL,
  feature_name_tr text NOT NULL,
  modulus_value text NOT NULL,
  isbasi_value text,
  bizimhesap_value text,
  category text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_comparisons ENABLE ROW LEVEL SECURITY;

-- Create pricing_trust_badges table
CREATE TABLE IF NOT EXISTS pricing_trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_tr text NOT NULL,
  description_en text NOT NULL,
  description_tr text NOT NULL,
  icon text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_trust_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anonymous users can view pricing (it's public data)
CREATE POLICY "Anyone can view active addons"
  ON pricing_addons FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage addons"
  ON pricing_addons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can view active comparisons"
  ON pricing_comparisons FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage comparisons"
  ON pricing_comparisons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can view active trust badges"
  ON pricing_trust_badges FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage trust badges"
  ON pricing_trust_badges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Seed pricing add-ons
INSERT INTO pricing_addons (name_en, name_tr, description_en, description_tr, price_tl, price_usd, category, icon, display_order) VALUES
  ('Marketplace Sync', 'Pazar Yeri Senkronizasyonu', 'Connect to popular marketplaces like Amazon, eBay, Trendyol', 'Amazon, eBay, Trendyol gibi popüler pazar yerlerine bağlanın', 850, 25, 'integration', 'Store', 1),
  ('Advanced HR Module', 'Gelişmiş İK Modülü', 'Full HR management with payroll, leave tracking, performance reviews', 'Bordro, izin takibi, performans değerlendirmeleri ile tam İK yönetimi', 1200, 35, 'module', 'Users', 2),
  ('Multi-Currency Support', 'Çoklu Para Birimi Desteği', 'Handle transactions in multiple currencies with auto exchange rates', 'Otomatik döviz kurları ile çoklu para biriminde işlem yapın', 650, 20, 'feature', 'DollarSign', 3),
  ('Advanced Reporting', 'Gelişmiş Raporlama', 'Custom reports, dashboards, and data export in multiple formats', 'Özel raporlar, panolar ve çoklu formatlarda veri dışa aktarımı', 750, 22, 'feature', 'BarChart', 4),
  ('WhatsApp Integration', 'WhatsApp Entegrasyonu', 'Send invoices and notifications via WhatsApp Business API', 'WhatsApp Business API ile fatura ve bildirim gönderin', 450, 15, 'integration', 'MessageCircle', 5),
  ('E-Archive Integration', 'E-Arşiv Entegrasyonu', 'E-Archive invoice integration for Turkey', 'Türkiye için E-Arşiv fatura entegrasyonu', 900, 27, 'integration', 'Archive', 6),
  ('API Access', 'API Erişimi', 'RESTful API access for custom integrations', 'Özel entegrasyonlar için RESTful API erişimi', 1100, 32, 'feature', 'Code', 7),
  ('Priority Support', 'Öncelikli Destek', '24/7 priority support with dedicated account manager', 'Özel hesap yöneticisi ile 7/24 öncelikli destek', 1500, 45, 'support', 'Headphones', 8)
ON CONFLICT DO NOTHING;

-- Seed competitor comparison data
INSERT INTO pricing_comparisons (feature_name_en, feature_name_tr, modulus_value, isbasi_value, bizimhesap_value, category, display_order) VALUES
  ('Real-time Synchronization', 'Gerçek Zamanlı Senkronizasyon', '✓ Instant', '✗ Delayed', '✗ Manual Refresh', 'performance', 1),
  ('Zero Latency Updates', 'Sıfır Gecikme Güncellemeleri', '✓ < 100ms', '✗ 2-5 seconds', '✗ 5-10 seconds', 'performance', 2),
  ('100% Modular Architecture', '100% Modüler Mimari', '✓ Full', '~ Partial', '✗ Monolithic', 'architecture', 3),
  ('AI-Powered Insights', 'AI Destekli İçgörüler', '✓ GPT-4 Integration', '✗ None', '✗ None', 'ai', 4),
  ('Mobile-First Design', 'Mobil-Öncelikli Tasarım', '✓ Full Responsive', '~ Basic Mobile', '~ Basic Mobile', 'ux', 5),
  ('Banking-Grade Security', 'Banka Düzeyinde Güvenlik', '✓ Supabase', '~ Standard SSL', '~ Standard SSL', 'security', 6),
  ('Custom Integrations', 'Özel Entegrasyonlar', '✓ RESTful API', '~ Limited API', '✗ None', 'integration', 7),
  ('Free Trial Period', 'Ücretsiz Deneme Süresi', '✓ 14 Days', '✓ 7 Days', '✗ None', 'pricing', 8),
  ('No Credit Card Required', 'Kredi Kartı Gerekmez', '✓ Yes', '✗ Required', '✗ Required', 'pricing', 9),
  ('Multi-language Support', 'Çoklu Dil Desteği', '✓ EN/TR', '✓ TR Only', '✓ TR Only', 'features', 10)
ON CONFLICT DO NOTHING;

-- Seed trust badges
INSERT INTO pricing_trust_badges (title_en, title_tr, description_en, description_tr, icon, display_order) VALUES
  ('Powered by Supabase', 'Supabase ile Çalışır', 'Banking-grade security with 99.9% uptime', 'Banka düzeyinde güvenlik ve %99.9 çalışma süresi', 'Shield', 1),
  ('Next.js Powered Speed', 'Next.js Hız Gücü', 'Lightning-fast performance with server-side rendering', 'Sunucu taraflı işleme ile yıldırım hızında performans', 'Zap', 2),
  ('Real-time Technology', 'Gerçek Zamanlı Teknoloji', 'Instant updates without page refresh', 'Sayfa yenilemeden anlık güncellemeler', 'Radio', 3),
  ('Enterprise Security', 'Kurumsal Güvenlik', 'Row-level security and data encryption', 'Satır düzeyinde güvenlik ve veri şifreleme', 'Lock', 4)
ON CONFLICT DO NOTHING;

-- Update existing subscription plans with new fields
UPDATE subscription_plans SET 
  plan_tier = 'lite',
  recommended = false,
  trial_days = 14,
  addon_support = true,
  price_usd = 19
WHERE name = 'STARTER';

UPDATE subscription_plans SET 
  plan_tier = 'pro',
  recommended = true,
  trial_days = 14,
  addon_support = true,
  price_usd = 49
WHERE name = 'ADVANCED';

UPDATE subscription_plans SET 
  plan_tier = 'scale',
  recommended = false,
  trial_days = 30,
  addon_support = true,
  price_usd = 129
WHERE name = 'ENTERPRISE';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_addons_active ON pricing_addons(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_comparisons_active ON pricing_comparisons(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_trust_badges_active ON pricing_trust_badges(is_active, display_order);
