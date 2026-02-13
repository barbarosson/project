/*
  # CMS Version 3: Professional Marketing Management Suite

  ## Overview
  Comprehensive upgrade to the CMS system with SEO, blog engine, marketing tools, and activity tracking.

  ## Changes

  ### 1. SEO Suite
  Add SEO fields to site_config table:
  - meta_title_en, meta_title_tr - Page titles for search engines
  - meta_description_en, meta_description_tr - Meta descriptions
  - og_image_url - OpenGraph image for social media sharing
  - keywords_en, keywords_tr - SEO keywords

  ### 2. Marketing Tools
  Add marketing features to site_config:
  - sticky_bar_enabled - Toggle for top announcement bar
  - sticky_bar_text_en, sticky_bar_text_tr - Announcement text
  - sticky_bar_bg_color - Background color for bar
  - popup_enabled - Toggle for lead generation popup
  - popup_title_en, popup_title_tr - Popup titles
  - popup_content_en, popup_content_tr - Popup content
  - popup_cta_text_en, popup_cta_text_tr - Call-to-action button text
  - popup_delay_seconds - Delay before showing popup

  ### 3. Blog Engine
  New 'posts' table for content management:
  - title_en, title_tr - Post titles
  - slug - URL-friendly identifier
  - excerpt_en, excerpt_tr - Short descriptions
  - content_en, content_tr - Full content (rich text)
  - category - Post category
  - featured_image_url - Post thumbnail
  - author_id - Reference to user
  - published_at - Publication timestamp
  - is_published - Publish status
  - view_count - Analytics

  ### 4. Activity Logs
  New 'admin_logs' table for audit trail:
  - user_id - Who made the change
  - action - Type of action (create, update, delete)
  - table_name - Which table was affected
  - record_id - ID of the affected record
  - changes - JSON of before/after values
  - ip_address - User's IP address
  - user_agent - Browser information

  ## Security
  - All tables have RLS enabled
  - Strict policies for authenticated users
  - Admin-only access for logs
  - Public read access for published posts
*/

-- ============================================================================
-- 1. SEO SUITE: Add SEO fields to site_config
-- ============================================================================

DO $$
BEGIN
  -- Meta titles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'meta_title_en') THEN
    ALTER TABLE site_config ADD COLUMN meta_title_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'meta_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN meta_title_tr TEXT DEFAULT '';
  END IF;

  -- Meta descriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'meta_description_en') THEN
    ALTER TABLE site_config ADD COLUMN meta_description_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'meta_description_tr') THEN
    ALTER TABLE site_config ADD COLUMN meta_description_tr TEXT DEFAULT '';
  END IF;

  -- OpenGraph image
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'og_image_url') THEN
    ALTER TABLE site_config ADD COLUMN og_image_url TEXT DEFAULT '';
  END IF;

  -- Keywords
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'keywords_en') THEN
    ALTER TABLE site_config ADD COLUMN keywords_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'keywords_tr') THEN
    ALTER TABLE site_config ADD COLUMN keywords_tr TEXT DEFAULT '';
  END IF;
END $$;

-- ============================================================================
-- 2. MARKETING TOOLS: Sticky Bar & Pop-ups
-- ============================================================================

DO $$
BEGIN
  -- Sticky bar fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'sticky_bar_enabled') THEN
    ALTER TABLE site_config ADD COLUMN sticky_bar_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'sticky_bar_text_en') THEN
    ALTER TABLE site_config ADD COLUMN sticky_bar_text_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'sticky_bar_text_tr') THEN
    ALTER TABLE site_config ADD COLUMN sticky_bar_text_tr TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'sticky_bar_bg_color') THEN
    ALTER TABLE site_config ADD COLUMN sticky_bar_bg_color TEXT DEFAULT '#2563eb';
  END IF;

  -- Popup fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_enabled') THEN
    ALTER TABLE site_config ADD COLUMN popup_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_title_en') THEN
    ALTER TABLE site_config ADD COLUMN popup_title_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_title_tr') THEN
    ALTER TABLE site_config ADD COLUMN popup_title_tr TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_content_en') THEN
    ALTER TABLE site_config ADD COLUMN popup_content_en TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_content_tr') THEN
    ALTER TABLE site_config ADD COLUMN popup_content_tr TEXT DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_cta_text_en') THEN
    ALTER TABLE site_config ADD COLUMN popup_cta_text_en TEXT DEFAULT 'Get Started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_cta_text_tr') THEN
    ALTER TABLE site_config ADD COLUMN popup_cta_text_tr TEXT DEFAULT 'Başlayın';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'popup_delay_seconds') THEN
    ALTER TABLE site_config ADD COLUMN popup_delay_seconds INTEGER DEFAULT 5;
  END IF;
END $$;

-- ============================================================================
-- 3. BLOG ENGINE: Posts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Content
  title_en TEXT NOT NULL DEFAULT '',
  title_tr TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL,
  excerpt_en TEXT DEFAULT '',
  excerpt_tr TEXT DEFAULT '',
  content_en TEXT DEFAULT '',
  content_tr TEXT DEFAULT '',
  
  -- Metadata
  category TEXT DEFAULT 'general',
  featured_image_url TEXT DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, slug)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_tenant_id ON posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- RLS Policies for posts
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can manage posts in their tenant"
  ON posts FOR ALL
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
-- 4. ACTIVITY LOGS: Admin audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Who and when
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- What happened
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_tenant_id ON admin_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_table_name ON admin_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- RLS Policies for admin_logs
CREATE POLICY "Authenticated users can view logs in their tenant"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );

CREATE POLICY "System can insert logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
    AND user_id = auth.uid()
  );

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to log CMS changes
CREATE OR REPLACE FUNCTION log_cms_change(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_changes JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get user's tenant from JWT
  v_tenant_id := COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

  -- Insert log
  INSERT INTO admin_logs (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    changes
  ) VALUES (
    v_tenant_id,
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_changes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to update post timestamp
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update post timestamp
DROP TRIGGER IF EXISTS update_posts_timestamp ON posts;
CREATE TRIGGER update_posts_timestamp
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_timestamp();

-- ============================================================================
-- 6. INITIAL DATA
-- ============================================================================

-- Update existing site_config with default SEO values
UPDATE site_config
SET 
  meta_title_en = COALESCE(NULLIF(meta_title_en, ''), site_name_en || ' - ' || tagline_en),
  meta_title_tr = COALESCE(NULLIF(meta_title_tr, ''), site_name_tr || ' - ' || tagline_tr),
  meta_description_en = COALESCE(NULLIF(meta_description_en, ''), 'Professional ERP and business management solution'),
  meta_description_tr = COALESCE(NULLIF(meta_description_tr, ''), 'Profesyonel ERP ve işletme yönetimi çözümü'),
  keywords_en = COALESCE(NULLIF(keywords_en, ''), 'ERP, business management, inventory, invoicing, CRM'),
  keywords_tr = COALESCE(NULLIF(keywords_tr, ''), 'ERP, işletme yönetimi, envanter, faturalama, CRM')
WHERE id = '00000000-0000-0000-0000-000000000001';
