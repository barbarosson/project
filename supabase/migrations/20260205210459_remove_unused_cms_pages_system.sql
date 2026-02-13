/*
  # Remove Unused CMS Pages System

  This migration removes the cms_pages and cms_page_sections tables and their related objects
  as they are not being used by the application. The application uses static layouts instead.

  ## What's Being Removed
  - cms_pages table (unused page definitions)
  - cms_page_sections table (unused section content)
  - Related indexes, triggers, and RLS policies
  - Foreign key constraints

  ## What's Being Kept
  - cms_banners table (actively used)
  - ui_styles table (actively used)
  - Other CMS features like theme settings

  ## Reason
  The application uses ParasutLandingLayout with static components.
  The CMS page/section editor in Site Commander is not being used.
  Only Banner Manager is actively utilized.
*/

-- Drop dependent objects first
DROP TRIGGER IF EXISTS update_cms_page_sections_updated_at ON cms_page_sections CASCADE;
DROP TRIGGER IF EXISTS update_cms_pages_updated_at ON cms_pages CASCADE;

-- Drop RLS policies
DROP POLICY IF EXISTS "Super admins can manage cms_page_sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Super admins can read cms_page_sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Authenticated users can read active cms_page_sections" ON cms_page_sections;
DROP POLICY IF EXISTS "Anyone can read active cms_page_sections" ON cms_page_sections;

DROP POLICY IF EXISTS "Super admins can manage cms_pages" ON cms_pages;
DROP POLICY IF EXISTS "Super admins can read cms_pages" ON cms_pages;
DROP POLICY IF EXISTS "Authenticated users can read active cms_pages" ON cms_pages;
DROP POLICY IF EXISTS "Anyone can read active cms_pages" ON cms_pages;

-- Drop tables (cascade will remove foreign keys)
DROP TABLE IF EXISTS cms_page_sections CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;

-- Log cleanup
DO $$
BEGIN
  RAISE NOTICE 'CMS pages and sections tables removed successfully';
  RAISE NOTICE 'Banner system (cms_banners) and theme settings (ui_styles) remain active';
END $$;
