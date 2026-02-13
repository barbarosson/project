/*
  # Fix CMS Banners RLS - Allow All Authenticated Users

  1. Changes
    - Drop existing super admin only policies
    - Create new policies allowing all authenticated users to manage banners
    - Keep public read-only access for active banners
  
  2. Security
    - Authenticated users can create, read, update, and delete banners
    - Public users can only view active banners within their date range
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admin can view all banners" ON cms_banners;
DROP POLICY IF EXISTS "Super admin can insert banners" ON cms_banners;
DROP POLICY IF EXISTS "Super admin can update banners" ON cms_banners;
DROP POLICY IF EXISTS "Super admin can delete banners" ON cms_banners;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can view all banners"
  ON cms_banners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert banners"
  ON cms_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update banners"
  ON cms_banners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete banners"
  ON cms_banners
  FOR DELETE
  TO authenticated
  USING (true);
