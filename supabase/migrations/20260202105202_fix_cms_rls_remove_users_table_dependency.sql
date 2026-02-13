/*
  # Fix CMS RLS Policies - Remove auth.users Table Dependency

  ## Problem
  RLS policies were trying to query auth.users table directly, causing "permission denied for table users" error.

  ## Solution
  Use auth.jwt()->>'email' to check user email instead of querying auth.users table.

  ## Changes
  1. **cms_banners** - Fix INSERT, UPDATE, DELETE policies
  2. **cms_pages** - Fix INSERT, UPDATE, DELETE policies  
  3. **cms_page_sections** - Fix INSERT, UPDATE, DELETE policies
  4. **ui_styles** - Fix INSERT, UPDATE policies
  5. **ui_colors** - Fix INSERT, UPDATE policies
  6. **ui_toggles** - Fix INSERT, UPDATE policies
  7. **banners** - Fix INSERT, UPDATE, DELETE policies
  8. **site_config** - Fix INSERT, UPDATE policies
*/

-- =====================================================
-- FIX cms_banners POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert banners" ON public.cms_banners;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON public.cms_banners;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON public.cms_banners;

CREATE POLICY "Authenticated users can insert banners" ON public.cms_banners 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update banners" ON public.cms_banners 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can delete banners" ON public.cms_banners 
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX cms_pages POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Authenticated users can update pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON public.cms_pages;

CREATE POLICY "Authenticated users can insert pages" ON public.cms_pages 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update pages" ON public.cms_pages 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can delete pages" ON public.cms_pages 
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX cms_page_sections POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert sections" ON public.cms_page_sections;
DROP POLICY IF EXISTS "Authenticated users can update sections" ON public.cms_page_sections;
DROP POLICY IF EXISTS "Authenticated users can delete sections" ON public.cms_page_sections;

CREATE POLICY "Authenticated users can insert sections" ON public.cms_page_sections 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update sections" ON public.cms_page_sections 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can delete sections" ON public.cms_page_sections 
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX ui_styles POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert ui_styles" ON public.ui_styles;
DROP POLICY IF EXISTS "Authenticated users can update ui_styles" ON public.ui_styles;

CREATE POLICY "Authenticated users can insert ui_styles" ON public.ui_styles 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update ui_styles" ON public.ui_styles 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX ui_colors POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert ui_colors" ON public.ui_colors;
DROP POLICY IF EXISTS "Authenticated users can update ui_colors" ON public.ui_colors;

CREATE POLICY "Authenticated users can insert ui_colors" ON public.ui_colors 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update ui_colors" ON public.ui_colors 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX ui_toggles POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert ui_toggles" ON public.ui_toggles;
DROP POLICY IF EXISTS "Authenticated users can update ui_toggles" ON public.ui_toggles;

CREATE POLICY "Authenticated users can insert ui_toggles" ON public.ui_toggles 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update ui_toggles" ON public.ui_toggles 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX banners TABLE POLICIES (different from cms_banners)
-- =====================================================

DROP POLICY IF EXISTS "Super admin can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Super admin can update banners" ON public.banners;
DROP POLICY IF EXISTS "Super admin can delete banners" ON public.banners;

CREATE POLICY "Super admin can insert banners" ON public.banners 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Super admin can update banners" ON public.banners 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Super admin can delete banners" ON public.banners 
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- FIX site_config POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Authenticated users can update site_config" ON public.site_config;

CREATE POLICY "Authenticated users can insert site_config" ON public.site_config 
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can update site_config" ON public.site_config 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');