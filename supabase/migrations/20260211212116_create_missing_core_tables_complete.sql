/*
  # Create Missing Core Tables for ERP System
  
  1. New Tables
    - `products` - Core product catalog (alternative to inventory)
      - id, tenant_id, sku, name, category
      - unit_price, purchase_price, sale_price, average_cost
      - current_stock, critical_level, min_stock_level, total_sold
      - stock_status, description, image_url, unit
      - is_active, created_at, updated_at
    
    - `tenants` - Multi-tenancy support
      - id, name, owner_id, settings
      - created_at, updated_at
    
    - `subscription_plans` - Subscription plan definitions
      - id, name, name_tr, plan_tier
      - price_monthly_tl, price_yearly_tl
      - price_monthly_usd, price_yearly_usd
      - features, max_users, max_invoices, max_products, max_customers
      - is_active, is_popular, display_order
      - created_at, updated_at
    
    - `user_subscriptions` - User subscription tracking
      - id, user_id, plan_name, status
      - started_at, expires_at
      - payment_method, auto_renew
      - created_at, updated_at
    
    - `site_config` - Global site configuration
      - Comprehensive CMS configuration for marketing site
      - Multi-language support (EN/TR)
      - Theme, colors, fonts, content sections
      - Contact info, metadata, maintenance mode
    
    - `ui_styles` - Dynamic UI styling system
      - element_name, property, value
      - Colors, fonts, spacing, patterns
      - created_at, updated_at
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for tenant isolation
    - Super admin access policies
*/

-- Create products table (core product catalog)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  sku text,
  name text NOT NULL,
  category text DEFAULT '',
  unit_price numeric DEFAULT 0,
  purchase_price numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  average_cost numeric DEFAULT 0,
  current_stock integer DEFAULT 0,
  critical_level integer DEFAULT 10,
  min_stock_level integer DEFAULT 5,
  total_sold integer DEFAULT 0,
  stock_status text DEFAULT 'in_stock',
  description text DEFAULT '',
  image_url text DEFAULT '',
  unit text DEFAULT 'adet',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_tr text DEFAULT '',
  plan_tier text DEFAULT 'free',
  price_monthly_tl numeric DEFAULT 0,
  price_yearly_tl numeric DEFAULT 0,
  price_monthly_usd numeric DEFAULT 0,
  price_yearly_usd numeric DEFAULT 0,
  features jsonb DEFAULT '[]',
  max_users integer DEFAULT 1,
  max_invoices integer DEFAULT 50,
  max_products integer DEFAULT 100,
  max_customers integer DEFAULT 50,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL DEFAULT 'ENTERPRISE',
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  payment_method text,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_config table (singleton for global settings)
CREATE TABLE IF NOT EXISTS site_config (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  key text DEFAULT 'main',
  
  -- Branding
  site_name_en text DEFAULT 'Modulus ERP',
  site_name_tr text DEFAULT 'Modulus ERP',
  tagline_en text DEFAULT 'Smart Business Management',
  tagline_tr text DEFAULT 'Akıllı İş Yönetimi',
  logo_url text DEFAULT '',
  logo_url_dark text DEFAULT '',
  
  -- Theme Colors
  primary_color text DEFAULT '#0ea5e9',
  secondary_color text DEFAULT '#06b6d4',
  accent_color text DEFAULT '#f59e0b',
  success_color text DEFAULT '#22c55e',
  warning_color text DEFAULT '#f59e0b',
  error_color text DEFAULT '#ef4444',
  info_color text DEFAULT '#3b82f6',
  
  -- Text and Background
  text_color text DEFAULT '#1e293b',
  text_color_secondary text DEFAULT '#64748b',
  background_color text DEFAULT '#ffffff',
  background_gradient text DEFAULT '',
  card_background text DEFAULT '#ffffff',
  navbar_background text DEFAULT '#ffffff',
  footer_background text DEFAULT '#1e293b',
  link_color text DEFAULT '#0ea5e9',
  hover_color text DEFAULT '#0284c7',
  shadow_color text DEFAULT 'rgba(0,0,0,0.1)',
  
  -- Typography
  heading_font text DEFAULT 'Inter',
  body_font text DEFAULT 'Inter',
  font_size_base text DEFAULT '16px',
  border_radius text DEFAULT '8px',
  button_radius text DEFAULT '8px',
  custom_css text DEFAULT '',
  
  -- Contact
  contact_email text DEFAULT 'info@modulustech.com',
  contact_phone text DEFAULT '+90 532 496 58 28',
  contact_address text DEFAULT 'Istanbul, Turkey',
  whatsapp_number text DEFAULT '',
  whatsapp_enabled boolean DEFAULT false,
  
  -- Hero Section
  hero_title_en text DEFAULT 'Transform Your Business with Smart ERP',
  hero_title_tr text DEFAULT 'İşletmenizi Akıllı ERP ile Dönüştürün',
  hero_subtitle_en text DEFAULT 'All-in-one solution for invoicing, inventory, CRM, and financial management.',
  hero_subtitle_tr text DEFAULT 'Faturalama, stok, CRM ve finansal yönetim için hepsi bir arada çözüm.',
  hero_cta_text_en text DEFAULT 'Get Started Free',
  hero_cta_text_tr text DEFAULT 'Ücretsiz Başlayın',
  hero_image_url text DEFAULT 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg',
  
  -- Features Section
  features_title_en text DEFAULT 'Everything you need to run your business',
  features_title_tr text DEFAULT 'İşletmenizi yönetmek için ihtiyacınız olan her şey',
  features_subtitle_en text DEFAULT 'Powerful features designed to streamline your operations',
  features_subtitle_tr text DEFAULT 'Operasyonlarınızı kolaylaştırmak için tasarlanmış güçlü özellikler',
  
  -- How It Works
  how_it_works_title_en text DEFAULT 'How It Works',
  how_it_works_title_tr text DEFAULT 'Nasıl Çalışır',
  how_it_works_subtitle_en text DEFAULT 'Get started in minutes with our simple 3-step process',
  how_it_works_subtitle_tr text DEFAULT 'Basit 3 adımlık süreçle dakikalar içinde başlayın',
  
  -- Pricing
  pricing_title_en text DEFAULT 'Simple, transparent pricing',
  pricing_title_tr text DEFAULT 'Basit, şeffaf fiyatlandırma',
  pricing_subtitle_en text DEFAULT 'Choose the plan that fits your business needs',
  pricing_subtitle_tr text DEFAULT 'İşletmenizin ihtiyaçlarına uygun planı seçin',
  
  -- FAQ
  faq_title_en text DEFAULT 'Frequently Asked Questions',
  faq_title_tr text DEFAULT 'Sıkça Sorulan Sorular',
  faq_subtitle_en text DEFAULT 'Find answers to common questions about our platform',
  faq_subtitle_tr text DEFAULT 'Platformumuz hakkında sık sorulan soruların cevaplarını bulun',
  
  -- Final CTA
  final_cta_title_en text DEFAULT 'Ready to transform your business?',
  final_cta_title_tr text DEFAULT 'İşletmenizi dönüştürmeye hazır mısınız?',
  final_cta_subtitle_en text DEFAULT 'Join thousands of businesses already using Modulus ERP',
  final_cta_subtitle_tr text DEFAULT 'Modulus ERP kullanan binlerce işletmeye katılın',
  final_cta_button_text_en text DEFAULT 'Start Free Trial',
  final_cta_button_text_tr text DEFAULT 'Ücretsiz Deneme Başlat',
  
  -- Social Proof
  social_proof_title_en text DEFAULT 'Trusted by thousands of businesses',
  social_proof_title_tr text DEFAULT 'Binlerce işletmenin güvendiği',
  social_proof_subtitle_en text DEFAULT 'See what our customers have to say',
  social_proof_subtitle_tr text DEFAULT 'Müşterilerimizin ne dediğini görün',
  trust_badge_en text DEFAULT 'Trusted & Reliable',
  trust_badge_tr text DEFAULT 'Güvenilir & Sağlam',
  
  -- SEO
  meta_title_en text DEFAULT 'Modulus ERP - Smart Business Management',
  meta_title_tr text DEFAULT 'Modulus ERP - Akıllı İş Yönetimi',
  meta_description_en text DEFAULT 'All-in-one ERP solution for modern businesses',
  meta_description_tr text DEFAULT 'Modern işletmeler için hepsi bir arada ERP çözümü',
  og_image_url text DEFAULT '',
  keywords_en text DEFAULT 'ERP, business management, invoicing, inventory',
  keywords_tr text DEFAULT 'ERP, iş yönetimi, faturalama, stok yönetimi',
  
  -- Marketing Features
  sticky_bar_enabled boolean DEFAULT false,
  sticky_bar_text_en text DEFAULT '',
  sticky_bar_text_tr text DEFAULT '',
  sticky_bar_bg_color text DEFAULT '#0ea5e9',
  
  popup_enabled boolean DEFAULT false,
  popup_title_en text DEFAULT '',
  popup_title_tr text DEFAULT '',
  popup_content_en text DEFAULT '',
  popup_content_tr text DEFAULT '',
  popup_cta_text_en text DEFAULT '',
  popup_cta_text_tr text DEFAULT '',
  popup_delay_seconds integer DEFAULT 5,
  
  -- Email Templates
  video_tutorial_links jsonb DEFAULT '{}',
  email_welcome_subject_en text DEFAULT 'Welcome to Modulus ERP',
  email_welcome_subject_tr text DEFAULT 'Modulus ERP''ye Hoş Geldiniz',
  email_welcome_body_en text DEFAULT '',
  email_welcome_body_tr text DEFAULT '',
  email_invoice_subject_en text DEFAULT 'Your Invoice',
  email_invoice_subject_tr text DEFAULT 'Faturanız',
  email_invoice_body_en text DEFAULT '',
  email_invoice_body_tr text DEFAULT '',
  email_low_credit_subject_en text DEFAULT 'Low Credit Alert',
  email_low_credit_subject_tr text DEFAULT 'Düşük Kredi Uyarısı',
  email_low_credit_body_en text DEFAULT '',
  email_low_credit_body_tr text DEFAULT '',
  
  -- Maintenance
  maintenance_mode boolean DEFAULT false,
  maintenance_message_en text DEFAULT 'Site Under Maintenance',
  maintenance_message_tr text DEFAULT 'Site Bakımda',
  maintenance_allowed_ips text[] DEFAULT ARRAY[]::text[],
  
  -- Stats
  stats_customers_count integer DEFAULT 2500,
  stats_transactions_count integer DEFAULT 150000,
  stats_years_active integer DEFAULT 5,
  stats_satisfaction_rate integer DEFAULT 99,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ui_styles table
CREATE TABLE IF NOT EXISTS ui_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_name text DEFAULT 'global',
  property text DEFAULT 'theme',
  value text DEFAULT '',
  
  -- Global Colors
  primary_color text DEFAULT '#0ea5e9',
  secondary_color text DEFAULT '#06b6d4',
  accent_color text DEFAULT '#f59e0b',
  
  -- Typography
  font_family text DEFAULT 'Inter',
  font_size text DEFAULT '16px',
  font_weight text DEFAULT '400',
  font_color text DEFAULT '#1e293b',
  line_height text DEFAULT '1.5',
  letter_spacing text DEFAULT '0',
  text_transform text DEFAULT 'none',
  text_decoration text DEFAULT 'none',
  heading_font_size text DEFAULT '32px',
  body_font_size text DEFAULT '16px',
  
  -- Logo
  logo_width text DEFAULT '120px',
  logo_height text DEFAULT 'auto',
  
  -- Spacing
  section_padding_x text DEFAULT '24px',
  section_padding_y text DEFAULT '48px',
  border_radius text DEFAULT '8px',
  
  -- Background Patterns
  background_pattern_type text DEFAULT '',
  background_pattern_url text DEFAULT '',
  background_pattern_opacity text DEFAULT '0.1',
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (tenant-based)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can view own tenant products'
  ) THEN
    CREATE POLICY "Users can view own tenant products"
      ON products FOR SELECT
      TO authenticated
      USING (tenant_id::text = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can insert own tenant products'
  ) THEN
    CREATE POLICY "Users can insert own tenant products"
      ON products FOR INSERT
      TO authenticated
      WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can update own tenant products'
  ) THEN
    CREATE POLICY "Users can update own tenant products"
      ON products FOR UPDATE
      TO authenticated
      USING (tenant_id::text = current_setting('app.tenant_id', true) OR is_super_admin())
      WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can delete own tenant products'
  ) THEN
    CREATE POLICY "Users can delete own tenant products"
      ON products FOR DELETE
      TO authenticated
      USING (tenant_id::text = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for tenants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can view own tenant'
  ) THEN
    CREATE POLICY "Users can view own tenant"
      ON tenants FOR SELECT
      TO authenticated
      USING (owner_id = auth.uid() OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Users can insert tenants'
  ) THEN
    CREATE POLICY "Users can insert tenants"
      ON tenants FOR INSERT
      TO authenticated
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'Owners can update own tenant'
  ) THEN
    CREATE POLICY "Owners can update own tenant"
      ON tenants FOR UPDATE
      TO authenticated
      USING (owner_id = auth.uid() OR is_super_admin())
      WITH CHECK (owner_id = auth.uid() OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for subscription_plans (public read, admin write)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Anyone can view active plans'
  ) THEN
    CREATE POLICY "Anyone can view active plans"
      ON subscription_plans FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Super admins can manage plans'
  ) THEN
    CREATE POLICY "Super admins can manage plans"
      ON subscription_plans FOR ALL
      TO authenticated
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END $$;

-- RLS Policies for user_subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users can view own subscription'
  ) THEN
    CREATE POLICY "Users can view own subscription"
      ON user_subscriptions FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'System can insert subscriptions'
  ) THEN
    CREATE POLICY "System can insert subscriptions"
      ON user_subscriptions FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid() OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'System can update subscriptions'
  ) THEN
    CREATE POLICY "System can update subscriptions"
      ON user_subscriptions FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid() OR is_super_admin())
      WITH CHECK (user_id = auth.uid() OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for site_config (public read, admin write)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'Anyone can view site config'
  ) THEN
    CREATE POLICY "Anyone can view site config"
      ON site_config FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'Super admins can manage site config'
  ) THEN
    CREATE POLICY "Super admins can manage site config"
      ON site_config FOR ALL
      TO authenticated
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END $$;

-- RLS Policies for ui_styles (public read, admin write)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ui_styles' AND policyname = 'Anyone can view ui styles'
  ) THEN
    CREATE POLICY "Anyone can view ui styles"
      ON ui_styles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ui_styles' AND policyname = 'Super admins can manage ui styles'
  ) THEN
    CREATE POLICY "Super admins can manage ui styles"
      ON ui_styles FOR ALL
      TO authenticated
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(plan_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_ui_styles_element ON ui_styles(element_name);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ui_styles' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_ui_styles_active ON ui_styles(is_active);
  END IF;
END $$;
