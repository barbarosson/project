/*
  # Create CMS Banners and Navigation System

  ## New Tables
  
  1. `banners`
    - `id` (uuid, primary key) - Unique identifier for each banner
    - `title` (text) - Banner title for admin reference
    - `image_url` (text) - URL to the banner image
    - `link_url` (text, nullable) - Optional link when banner is clicked
    - `is_active` (boolean) - Whether banner is currently displayed
    - `order_index` (integer) - Display order (lowest first)
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  2. `navigation_menus`
    - `id` (uuid, primary key) - Unique identifier for menu item
    - `label` (text) - Display text for the menu item
    - `slug` (text) - URL slug/path for navigation
    - `order_index` (integer) - Display order in menu
    - `is_visible` (boolean) - Whether menu item is shown
    - `icon` (text, nullable) - Icon name (lucide-react)
    - `parent_id` (uuid, nullable) - For nested/submenu items
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on both tables
  - Public read access for active/visible items
  - Admin-only write access (admin@modulus.com)
*/

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create navigation_menus table
CREATE TABLE IF NOT EXISTS navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  slug text NOT NULL,
  order_index integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  icon text,
  parent_id uuid REFERENCES navigation_menus(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_visible ON navigation_menus(is_visible, order_index);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent ON navigation_menus(parent_id);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;

-- Banners policies - public can view active, admin can do everything
CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (is_active = true OR auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can insert banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can update banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = 'admin@modulus.com')
  WITH CHECK (auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can delete banners"
  ON banners FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'email' = 'admin@modulus.com');

-- Navigation menus policies - public can view visible, admin can do everything
CREATE POLICY "Anyone can view visible menus"
  ON navigation_menus FOR SELECT
  USING (is_visible = true OR auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can insert menus"
  ON navigation_menus FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can update menus"
  ON navigation_menus FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = 'admin@modulus.com')
  WITH CHECK (auth.jwt()->>'email' = 'admin@modulus.com');

CREATE POLICY "Super admin can delete menus"
  ON navigation_menus FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'email' = 'admin@modulus.com');

-- Insert default navigation menu items
INSERT INTO navigation_menus (label, slug, order_index, is_visible, icon) VALUES
  ('Dashboard', '/dashboard', 1, true, 'LayoutDashboard'),
  ('Customers', '/customers', 2, true, 'Users'),
  ('Invoices', '/invoices', 3, true, 'FileText'),
  ('Proposals', '/proposals', 4, true, 'FileCheck'),
  ('Inventory', '/inventory', 5, true, 'Package'),
  ('Expenses', '/expenses', 6, true, 'Receipt'),
  ('Campaigns', '/campaigns', 7, true, 'Megaphone'),
  ('AI Insights', '/ai-insights', 8, true, 'Brain'),
  ('Support', '/support', 9, true, 'HeadphonesIcon'),
  ('Settings', '/settings', 10, true, 'Settings')
ON CONFLICT DO NOTHING;

-- Insert a default banner
INSERT INTO banners (title, image_url, is_active, order_index) VALUES
  ('Welcome Banner', 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920', true, 1)
ON CONFLICT DO NOTHING;