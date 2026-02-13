/*
  # Fix Function Search Path Security Issues

  ## SECURITY FIX
  Adds explicit search_path to SECURITY DEFINER functions to prevent search path exploitation.
  
  ## Issue
  Functions with SECURITY DEFINER execute with privileges of the function owner.
  Without explicit search_path, attackers could create malicious objects in their schema
  that shadow legitimate objects, causing the function to execute malicious code.

  ## Functions Fixed
  - refresh_executive_views: Adds SET search_path = public
  - update_cms_updated_at: Adds SET search_path = public

  ## Security Impact
  - Prevents search path exploitation attacks
  - Ensures functions only access intended schemas
  - Maintains principle of least privilege
*/

-- Fix refresh_executive_views function
CREATE OR REPLACE FUNCTION refresh_executive_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_business_health;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_critical_dates;
  
  RAISE NOTICE 'Executive dashboard views refreshed at %', NOW();
END;
$$;

-- Fix update_cms_updated_at function
CREATE OR REPLACE FUNCTION update_cms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'SECURITY FIX: Function Search Path';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✓ Fixed 2 SECURITY DEFINER functions';
  RAISE NOTICE '✓ Added explicit SET search_path = public';
  RAISE NOTICE '✓ Protected against search path exploitation';
  RAISE NOTICE '========================================================';
END $$;
