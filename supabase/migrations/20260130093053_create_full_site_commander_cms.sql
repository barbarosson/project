/*
  # Create Full Site Commander CMS System

  ## Overview
  This migration creates a comprehensive CMS system that allows management of all website pages and their sections dynamically.

  ## 1. New Tables
    
    ### `cms_pages`
    - `id` (uuid, primary key) - Unique identifier for each page
    - `slug` (text, unique) - URL-friendly page identifier (e.g., 'home', 'pricing')
    - `name` (text) - Display name of the page
    - `title` (text) - Page title for browser tab
    - `meta_description` (text) - SEO meta description
    - `meta_keywords` (text) - SEO meta keywords
    - `og_image` (text) - Open Graph image URL for social sharing
    - `is_active` (boolean) - Whether the page is published
    - `order_index` (integer) - Display order in navigation
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

    ### `cms_page_sections`
    - `id` (uuid, primary key) - Unique identifier for each section
    - `page_id` (uuid, foreign key) - Reference to cms_pages
    - `section_key` (text) - Unique identifier for the section (e.g., 'hero', 'features')
    - `section_name` (text) - Display name for the section
    - `content_json` (jsonb) - Dynamic content stored as JSON
    - `order_index` (integer) - Display order within the page
    - `is_active` (boolean) - Whether the section is published
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
    - Enable RLS on both tables
    - Public can read active pages and sections
    - Super admin can manage all content
    - Authenticated users can read all pages

  ## 3. Indexes
    - Index on page slug for fast lookups
    - Index on page_id for efficient section queries
    - Index on section_key for quick section retrieval
    - Composite index on (page_id, order_index) for ordered queries

  ## 4. Important Notes
    - content_json is flexible and can contain any structure (titles, descriptions, images, buttons, lists)
    - Sections are ordered by order_index for consistent display
    - Both tables use updated_at trigger for automatic timestamp management
*/

-- Create cms_pages table
CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  meta_description text DEFAULT '',
  meta_keywords text DEFAULT '',
  og_image text DEFAULT '',
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cms_page_sections table
CREATE TABLE IF NOT EXISTS cms_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  section_name text NOT NULL,
  content_json jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, section_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_active ON cms_pages(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_cms_page_sections_page_id ON cms_page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_sections_key ON cms_page_sections(page_id, section_key);
CREATE INDEX IF NOT EXISTS idx_cms_page_sections_order ON cms_page_sections(page_id, order_index) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_cms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS cms_pages_updated_at ON cms_pages;
CREATE TRIGGER cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

DROP TRIGGER IF EXISTS cms_page_sections_updated_at ON cms_page_sections;
CREATE TRIGGER cms_page_sections_updated_at
  BEFORE UPDATE ON cms_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_page_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_pages

-- Public can read active pages
CREATE POLICY "Public users can view active pages"
  ON cms_pages FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users can read all pages
CREATE POLICY "Authenticated users can view all pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (true);

-- Super admin can manage all pages
CREATE POLICY "Super admin can insert pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

CREATE POLICY "Super admin can update pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

CREATE POLICY "Super admin can delete pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

-- RLS Policies for cms_page_sections

-- Public can read active sections of active pages
CREATE POLICY "Public users can view active sections"
  ON cms_page_sections FOR SELECT
  TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM cms_pages
      WHERE cms_pages.id = cms_page_sections.page_id
      AND cms_pages.is_active = true
    )
  );

-- Authenticated users can read all sections
CREATE POLICY "Authenticated users can view all sections"
  ON cms_page_sections FOR SELECT
  TO authenticated
  USING (true);

-- Super admin can manage all sections
CREATE POLICY "Super admin can insert sections"
  ON cms_page_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

CREATE POLICY "Super admin can update sections"
  ON cms_page_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

CREATE POLICY "Super admin can delete sections"
  ON cms_page_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@modulus.com'
    )
  );

-- Create helper function to get page content
CREATE OR REPLACE FUNCTION get_page_content(page_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'page', row_to_json(p),
    'sections', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(s) ORDER BY s.order_index)
        FROM cms_page_sections s
        WHERE s.page_id = p.id AND s.is_active = true
      ),
      '[]'::jsonb
    )
  )
  INTO result
  FROM cms_pages p
  WHERE p.slug = page_slug AND p.is_active = true;
  
  RETURN result;
END;
$$;