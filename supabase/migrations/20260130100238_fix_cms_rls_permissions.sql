/*
  # Fix CMS RLS Permissions

  ## Overview
  This migration fixes the "permission denied for table users" error by creating
  a helper function with SECURITY DEFINER to check admin status safely.

  ## Changes
  1. Create a secure helper function to check if current user is super admin
  2. Update all CMS RLS policies to use this function instead of querying auth.users directly

  ## Security Notes
  - The helper function runs with elevated privileges (SECURITY DEFINER)
  - It safely checks the current user's email against the admin email
  - RLS policies use this function to determine admin access
*/

-- Create helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current authenticated user is the super admin
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'admin@modulus.com'
    )
  );
END;
$$;

-- Drop existing policies for cms_pages
DROP POLICY IF EXISTS "Public users can view active pages" ON cms_pages;
DROP POLICY IF EXISTS "Authenticated users can view all pages" ON cms_pages;
DROP POLICY IF EXISTS "Super admin can insert pages" ON cms_pages;
DROP POLICY IF EXISTS "Super admin can update pages" ON cms_pages;
DROP POLICY IF EXISTS "Super admin can delete pages" ON cms_pages;

-- Create new policies for cms_pages using the helper function
CREATE POLICY "Public users can view active pages"
  ON cms_pages FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can insert pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can delete pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Drop existing policies for cms_page_sections
DROP POLICY IF EXISTS "Public users can view active sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Authenticated users can view all sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Super admin can insert sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Super admin can update sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Super admin can delete sections" ON cms_page_sections;

-- Create new policies for cms_page_sections using the helper function
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

CREATE POLICY "Authenticated users can view all sections"
  ON cms_page_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can insert sections"
  ON cms_page_sections FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update sections"
  ON cms_page_sections FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can delete sections"
  ON cms_page_sections FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon;