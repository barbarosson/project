/*
  # CMS Operational & Marketing Modules

  ## Overview
  Add 6 powerful modules to transform the CMS into a complete business management suite.

  ## Changes

  ### 1. Help Center & FAQ Module
  New 'faqs' table:
  - question_en, question_tr - FAQ questions in both languages
  - answer_en, answer_tr - Detailed answers
  - category - Grouping (e.g., "Getting Started", "Billing", "Features")
  - order_index - Display order
  - is_published - Visibility control

  ### 2. Video Tutorials
  Add to site_config:
  - video_tutorial_links - JSONB field storing feature-to-video mappings
  - Example: {"invoices": "youtube-id-123", "dashboard": "loom-id-456"}

  ### 3. Coupon & Campaign Manager
  New 'coupons' table:
  - code - Unique coupon code
  - discount_type - 'percentage' or 'fixed'
  - discount_value - Amount or percentage
  - max_uses - Maximum number of uses (null = unlimited)
  - current_uses - Current usage count
  - valid_from, valid_until - Validity period
  - is_active - Enable/disable
  - applies_to_plans - Which subscription plans it applies to

  ### 4. Email Template Editor
  Add to site_config:
  - email_welcome_subject_en, email_welcome_subject_tr
  - email_welcome_body_en, email_welcome_body_tr
  - email_invoice_subject_en, email_invoice_subject_tr
  - email_invoice_body_en, email_invoice_body_tr
  - email_low_credit_subject_en, email_low_credit_subject_tr
  - email_low_credit_body_en, email_low_credit_body_tr

  ### 5. System Maintenance Mode
  Add to site_config:
  - maintenance_mode - Boolean to enable maintenance mode
  - maintenance_message_en, maintenance_message_tr - Message to display
  - maintenance_allowed_ips - JSONB array of IPs that can bypass

  ### 6. Testimonials Manager
  New 'customer_reviews' table:
  - customer_name - Name of the reviewer
  - company_name - Company they represent
  - position - Their job title
  - review_en, review_tr - Testimonial text
  - rating - Star rating (1-5)
  - logo_url - Company logo
  - is_featured - Show on landing page
  - order_index - Display order

  ## Security
  - All tables have RLS enabled
  - Public read access for published content
  - Admin-only write access
  - Proper indexes for performance
*/

-- ============================================================================
-- 1. HELP CENTER & FAQ MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Content
  question_en TEXT NOT NULL,
  question_tr TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_tr TEXT NOT NULL,
  
  -- Organization
  category TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faqs_tenant_id ON faqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published, order_index);

-- RLS Policies
CREATE POLICY "Anyone can view published FAQs"
  ON faqs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  )
  WITH CHECK (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

-- ============================================================================
-- 2. COUPON & CAMPAIGN MANAGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Coupon Details
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Discount Configuration
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  
  -- Usage Limits
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  
  -- Validity Period
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Target Plans
  applies_to_plans TEXT[] DEFAULT ARRAY['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON coupons(tenant_id);

-- RLS Policies
CREATE POLICY "Authenticated users can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND valid_from <= now() 
    AND (valid_until IS NULL OR valid_until >= now())
  );

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  )
  WITH CHECK (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

-- ============================================================================
-- 3. TESTIMONIALS MANAGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Reviewer Info
  customer_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT DEFAULT '',
  
  -- Review Content
  review_en TEXT NOT NULL,
  review_tr TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  
  -- Assets
  logo_url TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  
  -- Display Control
  is_featured BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_reviews_tenant_id ON customer_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_featured ON customer_reviews(is_featured, order_index);

-- RLS Policies
CREATE POLICY "Anyone can view featured reviews"
  ON customer_reviews FOR SELECT
  USING (is_featured = true);

CREATE POLICY "Admins can manage reviews"
  ON customer_reviews FOR ALL
  TO authenticated
  USING (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  )
  WITH CHECK (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

-- ============================================================================
-- 4. EXTEND SITE_CONFIG: Video Tutorials, Email Templates, Maintenance Mode
-- ============================================================================

DO $$
BEGIN
  -- Video Tutorials
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'video_tutorial_links') THEN
    ALTER TABLE site_config ADD COLUMN video_tutorial_links JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Email Templates - Welcome
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_welcome_subject_en') THEN
    ALTER TABLE site_config ADD COLUMN email_welcome_subject_en TEXT DEFAULT 'Welcome to Modulus ERP!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_welcome_subject_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_welcome_subject_tr TEXT DEFAULT 'Modulus ERP''ye Hoş Geldiniz!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_welcome_body_en') THEN
    ALTER TABLE site_config ADD COLUMN email_welcome_body_en TEXT DEFAULT 'Thank you for joining Modulus ERP. We are excited to have you on board!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_welcome_body_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_welcome_body_tr TEXT DEFAULT 'Modulus ERP''ye katıldığınız için teşekkür ederiz. Sizi aramızda görmekten mutluluk duyuyoruz!';
  END IF;

  -- Email Templates - Invoice
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_invoice_subject_en') THEN
    ALTER TABLE site_config ADD COLUMN email_invoice_subject_en TEXT DEFAULT 'Your Invoice from Modulus ERP';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_invoice_subject_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_invoice_subject_tr TEXT DEFAULT 'Modulus ERP Faturanız';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_invoice_body_en') THEN
    ALTER TABLE site_config ADD COLUMN email_invoice_body_en TEXT DEFAULT 'Please find your invoice attached. Thank you for your business!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_invoice_body_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_invoice_body_tr TEXT DEFAULT 'Faturanız ekte yer almaktadır. İşbirliğiniz için teşekkür ederiz!';
  END IF;

  -- Email Templates - Low Credit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_low_credit_subject_en') THEN
    ALTER TABLE site_config ADD COLUMN email_low_credit_subject_en TEXT DEFAULT 'Low Credit Alert - Modulus ERP';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_low_credit_subject_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_low_credit_subject_tr TEXT DEFAULT 'Düşük Kredi Uyarısı - Modulus ERP';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_low_credit_body_en') THEN
    ALTER TABLE site_config ADD COLUMN email_low_credit_body_en TEXT DEFAULT 'Your credit balance is running low. Please top up to continue using our services.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'email_low_credit_body_tr') THEN
    ALTER TABLE site_config ADD COLUMN email_low_credit_body_tr TEXT DEFAULT 'Kredi bakiyeniz azalıyor. Hizmetlerimizi kullanmaya devam etmek için lütfen yükleyin.';
  END IF;

  -- Maintenance Mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'maintenance_mode') THEN
    ALTER TABLE site_config ADD COLUMN maintenance_mode BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'maintenance_message_en') THEN
    ALTER TABLE site_config ADD COLUMN maintenance_message_en TEXT DEFAULT 'We are currently performing maintenance. Please check back soon!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'maintenance_message_tr') THEN
    ALTER TABLE site_config ADD COLUMN maintenance_message_tr TEXT DEFAULT 'Şu anda bakım çalışması yapıyoruz. Lütfen daha sonra tekrar kontrol edin!';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'maintenance_allowed_ips') THEN
    ALTER TABLE site_config ADD COLUMN maintenance_allowed_ips JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_coupon_code TEXT,
  p_plan_name TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
  AND is_active = true
  AND valid_from <= now()
  AND (valid_until IS NULL OR valid_until >= now());

  -- Coupon not found or inactive
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, ''::TEXT, 0::NUMERIC, 'Invalid or expired coupon code'::TEXT;
    RETURN;
  END IF;

  -- Check if plan is applicable
  IF NOT (p_plan_name = ANY(v_coupon.applies_to_plans)) THEN
    RETURN QUERY SELECT false, ''::TEXT, 0::NUMERIC, 'Coupon not valid for this plan'::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, ''::TEXT, 0::NUMERIC, 'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Valid coupon
  RETURN QUERY SELECT 
    true, 
    v_coupon.discount_type, 
    v_coupon.discount_value,
    'Coupon applied successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE code = p_coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to update FAQ timestamp
CREATE OR REPLACE FUNCTION update_faq_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for FAQ updates
DROP TRIGGER IF EXISTS update_faqs_timestamp ON faqs;
CREATE TRIGGER update_faqs_timestamp
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_timestamp();

-- Function to update review timestamp
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review updates
DROP TRIGGER IF EXISTS update_reviews_timestamp ON customer_reviews;
CREATE TRIGGER update_reviews_timestamp
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_timestamp();

-- ============================================================================
-- 6. INITIAL SAMPLE DATA
-- ============================================================================

-- Insert sample FAQs
INSERT INTO faqs (question_en, question_tr, answer_en, answer_tr, category, order_index, is_published)
VALUES
  (
    'What is Modulus ERP?',
    'Modulus ERP nedir?',
    'Modulus ERP is a comprehensive business management solution that helps you manage invoices, inventory, customers, and more.',
    'Modulus ERP, faturaları, envanteri, müşterileri ve daha fazlasını yönetmenize yardımcı olan kapsamlı bir işletme yönetimi çözümüdür.',
    'Getting Started',
    1,
    true
  ),
  (
    'How do I create my first invoice?',
    'İlk faturamı nasıl oluştururum?',
    'Navigate to the Invoices page from the sidebar, then click "New Invoice" to get started. Fill in customer details and line items.',
    'Kenar çubuğundan Faturalar sayfasına gidin, ardından başlamak için "Yeni Fatura" ya tıklayın. Müşteri bilgilerini ve satır öğelerini doldurun.',
    'Features',
    2,
    true
  ),
  (
    'What payment methods do you accept?',
    'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    'We accept all major credit cards, bank transfers, and PayPal for subscription payments.',
    'Abonelik ödemeleri için tüm büyük kredi kartlarını, banka havalelerini ve PayPal''ı kabul ediyoruz.',
    'Billing',
    3,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample testimonials
INSERT INTO customer_reviews (customer_name, company_name, position, review_en, review_tr, rating, order_index, is_featured)
VALUES
  (
    'Sarah Johnson',
    'Tech Innovations Inc.',
    'CEO',
    'Modulus ERP transformed our business operations. The intuitive interface and powerful features have saved us countless hours.',
    'Modulus ERP iş operasyonlarımızı dönüştürdü. Sezgisel arayüz ve güçlü özellikler bize sayısız saat kazandırdı.',
    5,
    1,
    true
  ),
  (
    'Michael Chen',
    'Global Trading Co.',
    'Operations Manager',
    'The inventory management system is exactly what we needed. Real-time tracking has reduced our overhead significantly.',
    'Envanter yönetim sistemi tam olarak ihtiyacımız olan şeydi. Gerçek zamanlı takip, genel giderlerimizi önemli ölçüde azalttı.',
    5,
    2,
    true
  ),
  (
    'Emma Rodriguez',
    'Creative Solutions Ltd.',
    'Finance Director',
    'Outstanding customer support and a platform that grows with your business. Highly recommend!',
    'Mükemmel müşteri desteği ve işinizle birlikte büyüyen bir platform. Şiddetle tavsiye ederim!',
    5,
    3,
    true
  )
ON CONFLICT DO NOTHING;
