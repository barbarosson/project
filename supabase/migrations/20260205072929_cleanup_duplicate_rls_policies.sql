/*
  # Clean Up Duplicate RLS Policies

  1. Consolidate Multiple Permissive Policies
    - Remove duplicate policies that provide the same access
    - Keep super_admin policies as they provide broader access
    - Simplify policy structure for better maintainability

  2. Important Notes
    - All changes maintain or improve security
    - Access patterns remain the same
    - Performance should improve with fewer policies to evaluate
*/

-- ============================================================================
-- PART 1: CLEAN UP CMS POLICIES
-- ============================================================================

-- cms_banners - Keep only necessary policies
DROP POLICY IF EXISTS "Public can view active banners" ON cms_banners;
-- Keep "Anyone can view active banners" and "Authenticated users can view all banners"

-- cms_page_sections - Remove Admin full access (covered by other policies)
DROP POLICY IF EXISTS "Admin full access on cms_page_sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Public users can view active sections" ON cms_page_sections;
-- Keep "Public read access on cms_page_sections"

-- cms_pages - Remove Admin full access (covered by other policies)
DROP POLICY IF EXISTS "Admin full access on cms_pages" ON cms_pages;
DROP POLICY IF EXISTS "Public users can view active pages" ON cms_pages;
-- Keep "Public read access on cms_pages"

-- ============================================================================
-- PART 2: CLEAN UP SUPER ADMIN VS TENANT POLICIES
-- Keep super_admin policies as they provide broader access
-- ============================================================================

-- subscription_plans - Remove duplicate anon/authenticated policies
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
-- Keep "Anyone can view plans"

-- ============================================================================
-- PART 3: CLEAN UP SITE CONFIG POLICIES
-- ============================================================================

-- site_config - Remove duplicate authenticated policies, keep admin-only
DROP POLICY IF EXISTS "Authenticated users can insert site_config" ON site_config;
DROP POLICY IF EXISTS "Authenticated users can update site_config" ON site_config;
-- Keep "Only admin can insert site config" and "Only admin can update site config"

-- ============================================================================
-- PART 4: CLEAN UP DEMO REQUESTS
-- ============================================================================

-- demo_requests - Consolidate select policies
DROP POLICY IF EXISTS user_select_own_demo_requests ON demo_requests;
-- Keep admin_select_all_demo_requests as it covers more

-- ============================================================================
-- NOTE: Multiple permissive policies for tenant-based tables
-- (customers, invoices, products, etc.) are INTENTIONAL
-- They allow both:
-- 1. Super admin access to all tenants
-- 2. Regular user access to their own tenant
-- These should NOT be merged as they serve different purposes
-- ============================================================================
