/*
  # Create AI Trend Agent System (GETA)

  1. New Tables
    - `trend_regions`
      - `id` (serial, primary key)
      - `name` (text) - Region display name
      - `code` (text, unique) - ISO code or identifier
      - `level` (text) - continent, country, region, city
      - `parent_code` (text) - Parent region code
      - `timezone` (text) - Timezone identifier
      - `currency` (text) - Default currency
      - `is_active` (boolean) - Whether region is active
    - `trend_categories`
      - `id` (serial, primary key)
      - `name` (text) - Category display name
      - `slug` (text, unique) - URL-friendly identifier
      - `parent_id` (integer) - Parent category for hierarchy
      - `icon` (text) - Icon identifier
      - `sort_order` (integer) - Display order
    - `trend_searches`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid) - Tenant reference
      - `user_id` (uuid) - User who ran the search
      - `region_code` (text) - Selected region
      - `category_slug` (text) - Selected category
      - `subcategory_slug` (text) - Selected subcategory
      - `forecast_days` (integer) - Forecast horizon
      - `filters` (jsonb) - Additional filters (price range, etc.)
      - `created_at` (timestamptz)
    - `trend_results`
      - `id` (uuid, primary key)
      - `search_id` (uuid) - FK to trend_searches
      - `tenant_id` (uuid) - Tenant reference
      - `product_name` (text) - Trending product name
      - `trend_score` (numeric) - 0-100 score
      - `confidence` (numeric) - 0-100 confidence
      - `rank` (integer) - Position in results
      - `category` (text) - Product category
      - `price_range_min` (numeric)
      - `price_range_max` (numeric)
      - `currency` (text)
      - `trend_direction` (text) - rising, stable, declining, accelerating
      - `data_sources` (jsonb) - Which sources contributed
      - `seasonal_factor` (numeric) - Seasonal multiplier applied
      - `event_boost` (numeric) - Event boost applied
      - `explanation` (text) - AI-generated explanation
      - `image_url` (text) - Product image URL
      - `marketplace_links` (jsonb) - Links to marketplace listings
      - `created_at` (timestamptz)
    - `trend_saved_reports`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid) - Tenant reference
      - `user_id` (uuid)
      - `title` (text) - Report title
      - `search_id` (uuid) - FK to trend_searches
      - `notes` (text) - User notes
      - `is_favorite` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - trend_regions and trend_categories are readable by all authenticated users
    - trend_searches, trend_results, trend_saved_reports require tenant ownership

  3. Indexes
    - Performance indexes on tenant_id, search_id, region_code, category_slug
*/

-- 1. Trend Regions reference table
CREATE TABLE IF NOT EXISTS trend_regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL DEFAULT 'country',
  parent_code TEXT,
  timezone TEXT,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trend_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trend regions"
  ON trend_regions FOR SELECT TO authenticated USING (is_active = true);

-- Seed major regions
INSERT INTO trend_regions (name, code, level, parent_code, timezone, currency) VALUES
  ('Global', 'GLOBAL', 'global', NULL, 'UTC', 'USD'),
  ('Europe', 'EU', 'continent', 'GLOBAL', 'Europe/Berlin', 'EUR'),
  ('North America', 'NA', 'continent', 'GLOBAL', 'America/New_York', 'USD'),
  ('Asia', 'AS', 'continent', 'GLOBAL', 'Asia/Tokyo', 'USD'),
  ('South America', 'SA', 'continent', 'GLOBAL', 'America/Sao_Paulo', 'USD'),
  ('Africa', 'AF', 'continent', 'GLOBAL', 'Africa/Lagos', 'USD'),
  ('Oceania', 'OC', 'continent', 'GLOBAL', 'Australia/Sydney', 'AUD'),
  ('Turkey', 'TR', 'country', 'EU', 'Europe/Istanbul', 'TRY'),
  ('United States', 'US', 'country', 'NA', 'America/New_York', 'USD'),
  ('United Kingdom', 'GB', 'country', 'EU', 'Europe/London', 'GBP'),
  ('Germany', 'DE', 'country', 'EU', 'Europe/Berlin', 'EUR'),
  ('France', 'FR', 'country', 'EU', 'Europe/Paris', 'EUR'),
  ('Japan', 'JP', 'country', 'AS', 'Asia/Tokyo', 'JPY'),
  ('China', 'CN', 'country', 'AS', 'Asia/Shanghai', 'CNY'),
  ('India', 'IN', 'country', 'AS', 'Asia/Kolkata', 'INR'),
  ('Brazil', 'BR', 'country', 'SA', 'America/Sao_Paulo', 'BRL'),
  ('South Korea', 'KR', 'country', 'AS', 'Asia/Seoul', 'KRW'),
  ('Canada', 'CA', 'country', 'NA', 'America/Toronto', 'CAD'),
  ('Australia', 'AU', 'country', 'OC', 'Australia/Sydney', 'AUD'),
  ('UAE', 'AE', 'country', 'AS', 'Asia/Dubai', 'AED'),
  ('Saudi Arabia', 'SA_C', 'country', 'AS', 'Asia/Riyadh', 'SAR'),
  ('Mexico', 'MX', 'country', 'NA', 'America/Mexico_City', 'MXN'),
  ('Italy', 'IT', 'country', 'EU', 'Europe/Rome', 'EUR'),
  ('Spain', 'ES', 'country', 'EU', 'Europe/Madrid', 'EUR'),
  ('Netherlands', 'NL', 'country', 'EU', 'Europe/Amsterdam', 'EUR'),
  ('Istanbul', 'TR_IST', 'city', 'TR', 'Europe/Istanbul', 'TRY'),
  ('Ankara', 'TR_ANK', 'city', 'TR', 'Europe/Istanbul', 'TRY'),
  ('Izmir', 'TR_IZM', 'city', 'TR', 'Europe/Istanbul', 'TRY'),
  ('New York', 'US_NYC', 'city', 'US', 'America/New_York', 'USD'),
  ('London', 'GB_LDN', 'city', 'GB', 'Europe/London', 'GBP'),
  ('Tokyo', 'JP_TKY', 'city', 'JP', 'Asia/Tokyo', 'JPY'),
  ('Mumbai', 'IN_MUM', 'city', 'IN', 'Asia/Kolkata', 'INR'),
  ('Berlin', 'DE_BER', 'city', 'DE', 'Europe/Berlin', 'EUR'),
  ('Paris', 'FR_PAR', 'city', 'FR', 'Europe/Paris', 'EUR'),
  ('Dubai', 'AE_DXB', 'city', 'AE', 'Asia/Dubai', 'AED')
ON CONFLICT (code) DO NOTHING;

-- 2. Trend Categories
CREATE TABLE IF NOT EXISTS trend_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES trend_categories(id),
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trend_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trend categories"
  ON trend_categories FOR SELECT TO authenticated USING (true);

-- Seed main categories and subcategories
INSERT INTO trend_categories (name, slug, parent_id, icon, sort_order) VALUES
  ('Electronics & Technology', 'electronics', NULL, 'cpu', 1),
  ('Fashion & Apparel', 'fashion', NULL, 'shirt', 2),
  ('Home & Garden', 'home-garden', NULL, 'home', 3),
  ('Sports & Outdoors', 'sports', NULL, 'dumbbell', 4),
  ('Health & Beauty', 'health-beauty', NULL, 'heart', 5),
  ('Books & Media', 'books-media', NULL, 'book-open', 6),
  ('Food & Beverage', 'food-beverage', NULL, 'utensils', 7),
  ('Toys & Games', 'toys-games', NULL, 'gamepad-2', 8),
  ('Automotive', 'automotive', NULL, 'car', 9),
  ('Pet Supplies', 'pet-supplies', NULL, 'dog', 10),
  ('Office & Business', 'office', NULL, 'briefcase', 11),
  ('Baby & Kids', 'baby-kids', NULL, 'baby', 12)
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for Electronics
INSERT INTO trend_categories (name, slug, parent_id, icon, sort_order)
SELECT sub.name, sub.slug, c.id, sub.icon, sub.sort_order
FROM (VALUES
  ('Smartphones', 'smartphones', 'smartphone', 1),
  ('Laptops & Computers', 'laptops', 'laptop', 2),
  ('Tablets', 'tablets', 'tablet', 3),
  ('Wearables', 'wearables', 'watch', 4),
  ('Audio & Headphones', 'audio', 'headphones', 5),
  ('Smart Home', 'smart-home', 'wifi', 6),
  ('Gaming', 'gaming', 'gamepad-2', 7),
  ('Cameras & Photography', 'cameras', 'camera', 8)
) AS sub(name, slug, icon, sort_order)
CROSS JOIN trend_categories c
WHERE c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for Fashion
INSERT INTO trend_categories (name, slug, parent_id, icon, sort_order)
SELECT sub.name, sub.slug, c.id, sub.icon, sub.sort_order
FROM (VALUES
  ('Men''s Clothing', 'mens-clothing', 'shirt', 1),
  ('Women''s Clothing', 'womens-clothing', 'shirt', 2),
  ('Shoes & Footwear', 'shoes', 'footprints', 3),
  ('Bags & Accessories', 'bags', 'shopping-bag', 4),
  ('Jewelry & Watches', 'jewelry', 'gem', 5),
  ('Activewear', 'activewear', 'dumbbell', 6)
) AS sub(name, slug, icon, sort_order)
CROSS JOIN trend_categories c
WHERE c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

-- Subcategories for Home & Garden
INSERT INTO trend_categories (name, slug, parent_id, icon, sort_order)
SELECT sub.name, sub.slug, c.id, sub.icon, sub.sort_order
FROM (VALUES
  ('Furniture', 'furniture', 'armchair', 1),
  ('Kitchen & Dining', 'kitchen', 'utensils-crossed', 2),
  ('Bedding & Bath', 'bedding', 'bed', 3),
  ('Garden & Outdoor', 'garden', 'flower-2', 4),
  ('Lighting', 'lighting', 'lamp', 5),
  ('Home Decor', 'home-decor', 'palette', 6)
) AS sub(name, slug, icon, sort_order)
CROSS JOIN trend_categories c
WHERE c.slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

-- 3. Trend Searches
CREATE TABLE IF NOT EXISTS trend_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  region_code TEXT NOT NULL DEFAULT 'GLOBAL',
  category_slug TEXT NOT NULL,
  subcategory_slug TEXT,
  forecast_days INTEGER NOT NULL DEFAULT 30,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trend_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant trend searches"
  ON trend_searches FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert trend searches for own tenant"
  ON trend_searches FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own trend searches"
  ON trend_searches FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_trend_searches_tenant ON trend_searches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_searches_created ON trend_searches(created_at DESC);

-- 4. Trend Results
CREATE TABLE IF NOT EXISTS trend_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES trend_searches(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  trend_score NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  currency TEXT DEFAULT 'USD',
  trend_direction TEXT NOT NULL DEFAULT 'stable',
  data_sources JSONB DEFAULT '[]',
  seasonal_factor NUMERIC DEFAULT 1.0,
  event_boost NUMERIC DEFAULT 1.0,
  explanation TEXT,
  image_url TEXT,
  marketplace_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trend_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant trend results"
  ON trend_results FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert trend results for own tenant"
  ON trend_results FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own trend results"
  ON trend_results FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_trend_results_search ON trend_results(search_id);
CREATE INDEX IF NOT EXISTS idx_trend_results_tenant ON trend_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_results_score ON trend_results(trend_score DESC);

-- 5. Saved Reports
CREATE TABLE IF NOT EXISTS trend_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  search_id UUID NOT NULL REFERENCES trend_searches(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trend_saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant saved reports"
  ON trend_saved_reports FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert saved reports for own tenant"
  ON trend_saved_reports FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can update own saved reports"
  ON trend_saved_reports FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own saved reports"
  ON trend_saved_reports FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_tenant ON trend_saved_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_favorite ON trend_saved_reports(is_favorite) WHERE is_favorite = true;
