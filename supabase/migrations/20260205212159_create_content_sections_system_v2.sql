/*
  # Create Content Sections Management System

  This migration creates a flexible content management system for editable text content
  throughout the application, including landing pages and application pages.

  ## New Tables
  - `content_sections`: Stores all editable content sections with multi-language support
    - `id` (uuid, primary key)
    - `section_key` (text, unique identifier like 'hero_title', 'features_heading')
    - `category` (text, organizes sections: 'landing', 'dashboard', 'pricing', etc.)
    - `label_en` (text, human-readable label in English)
    - `label_tr` (text, human-readable label in Turkish)
    - `content_en` (text, English content)
    - `content_tr` (text, Turkish content)
    - `content_type` (text, 'text', 'textarea', 'html', 'url')
    - `order_index` (integer, for ordering)
    - `is_active` (boolean, enable/disable sections)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on content_sections table
  - Super admins can manage all content
  - Authenticated users can read active content
  - Anonymous users can read active content

  ## Indexes
  - Index on section_key for fast lookups
  - Index on category for filtering
  - Index on is_active for performance
*/

-- Create content_sections table
CREATE TABLE IF NOT EXISTS content_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general',
  label_en text NOT NULL,
  label_tr text NOT NULL,
  content_en text DEFAULT '',
  content_tr text DEFAULT '',
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'textarea', 'html', 'url')),
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_sections_key ON content_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_content_sections_category ON content_sections(category);
CREATE INDEX IF NOT EXISTS idx_content_sections_active ON content_sections(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage content_sections"
  ON content_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can read active content_sections"
  ON content_sections
  FOR SELECT
  USING (is_active = true);

-- Seed default content sections
INSERT INTO content_sections (section_key, category, label_en, label_tr, content_en, content_tr, content_type, order_index) VALUES
-- Landing Page - Hero Section
('landing_hero_title', 'landing', 'Hero Title', 'Hero Başlık', 'Transform Your Business with Smart ERP', 'İşletmenizi Akıllı ERP ile Dönüştürün', 'text', 10),
('landing_hero_subtitle', 'landing', 'Hero Subtitle', 'Hero Alt Başlık', 'All-in-one business management platform for modern companies', 'Modern şirketler için hepsi bir arada iş yönetim platformu', 'textarea', 20),
('landing_hero_cta_primary', 'landing', 'Primary CTA Text', 'Birincil CTA Metni', 'Start Free Trial', 'Ücretsiz Deneyin', 'text', 30),
('landing_hero_cta_secondary', 'landing', 'Secondary CTA Text', 'İkincil CTA Metni', 'Watch Demo', 'Demo İzleyin', 'text', 40),

-- Landing Page - Features
('landing_features_title', 'landing', 'Features Title', 'Özellikler Başlık', 'Powerful Features for Modern Business', 'Modern İşletmeler için Güçlü Özellikler', 'text', 100),
('landing_features_subtitle', 'landing', 'Features Subtitle', 'Özellikler Alt Başlık', 'Everything you need to run your business efficiently', 'İşletmenizi verimli yönetmek için ihtiyacınız olan her şey', 'textarea', 110),

-- Landing Page - Numbers That Matter
('landing_stats_badge', 'landing', 'Stats Badge Text', 'İstatistik Badge Metni', 'Trusted & Reliable', 'Güvenilir & Sağlam', 'text', 200),
('landing_stats_title', 'landing', 'Stats Title', 'İstatistik Başlık', 'Numbers That Matter', 'Önemli Rakamlar', 'text', 210),
('landing_stats_subtitle', 'landing', 'Stats Subtitle', 'İstatistik Alt Başlık', 'We build trust through transparency and consistent delivery', 'Şeffaflık ve tutarlı hizmet ile güven inşa ediyoruz', 'textarea', 220),

-- Landing Page - Pricing
('landing_pricing_title', 'landing', 'Pricing Title', 'Fiyatlandırma Başlık', 'Simple, Transparent Pricing', 'Basit, Şeffaf Fiyatlandırma', 'text', 300),
('landing_pricing_subtitle', 'landing', 'Pricing Subtitle', 'Fiyatlandırma Alt Başlık', 'Choose the plan that fits your business needs', 'İşletmenizin ihtiyaçlarına uygun planı seçin', 'textarea', 310),

-- Landing Page - CTA
('landing_cta_title', 'landing', 'Final CTA Title', 'Son CTA Başlık', 'Ready to Transform Your Business?', 'İşletmenizi Dönüştürmeye Hazır mısınız?', 'text', 400),
('landing_cta_subtitle', 'landing', 'Final CTA Subtitle', 'Son CTA Alt Başlık', 'Join thousands of businesses already using Modulus ERP', 'Modulus ERP kullanan binlerce işletmeye katılın', 'textarea', 410),
('landing_cta_button', 'landing', 'Final CTA Button', 'Son CTA Butonu', 'Get Started Now', 'Hemen Başlayın', 'text', 420),

-- Contact Page
('contact_page_title', 'contact', 'Page Title', 'Sayfa Başlığı', 'Get in Touch', 'İletişime Geçin', 'text', 500),
('contact_page_subtitle', 'contact', 'Page Subtitle', 'Sayfa Alt Başlığı', 'Have questions? We would love to hear from you.', 'Sorularınız mı var? Sizden haber almayı çok isteriz.', 'textarea', 510),
('contact_email', 'contact', 'Contact Email', 'İletişim Email', 'info@modulustech.com', 'info@modulustech.com', 'text', 520),
('contact_phone', 'contact', 'Contact Phone', 'İletişim Telefon', '+90 532 496 58 28', '+90 532 496 58 28', 'text', 530),

-- Dashboard
('dashboard_welcome_title', 'dashboard', 'Welcome Title', 'Hoş Geldiniz Başlık', 'Welcome to Your Dashboard', 'Dashboard''a Hoş Geldiniz', 'text', 600),
('dashboard_welcome_subtitle', 'dashboard', 'Welcome Subtitle', 'Hoş Geldiniz Alt Başlık', 'Manage your business with ease', 'İşletmenizi kolaylıkla yönetin', 'text', 610)

ON CONFLICT (section_key) DO NOTHING;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Content sections system created successfully';
  RAISE NOTICE 'Seeded % default content sections', (SELECT COUNT(*) FROM content_sections);
END $$;
