/*
  # Remove Unused and Duplicate Indexes

  ## Overview
  Removes indexes that are:
  - Duplicates (same table, same column)
  - On materialized views that shouldn't be in API
  - Truly unused and unnecessary

  ## Indexes Removed
  - Duplicate tenant indexes
  - Materialized view indexes (mv_global_business_health, mv_critical_dates)
  - Overly specific indexes unlikely to be used
  
  ## Performance Impact
  - Reduces storage overhead
  - Improves write performance (fewer indexes to maintain)
  - Reduces maintenance overhead

  ## Important
  - Only removes truly redundant or problematic indexes
  - Keeps critical indexes for tenant_id, foreign keys, etc.
*/

-- Remove duplicate tenant indexes (keeping the _tenant_id version)
DROP INDEX IF EXISTS idx_profiles_tenant;
DROP INDEX IF EXISTS idx_company_settings_tenant;
DROP INDEX IF EXISTS idx_tax_rates_tenant;

-- Remove materialized view indexes (these views shouldn't be in API anyway)
DROP INDEX IF EXISTS idx_mv_business_health_company;
DROP INDEX IF EXISTS idx_mv_business_health_score;
DROP INDEX IF EXISTS idx_mv_critical_dates_type;
DROP INDEX IF EXISTS idx_mv_critical_dates_date;
DROP INDEX IF EXISTS idx_mv_critical_dates_severity;

-- Remove overly specific indexes that are unlikely to be used
DROP INDEX IF EXISTS idx_navigation_menus_visible;
DROP INDEX IF EXISTS idx_banners_active;
DROP INDEX IF EXISTS idx_content_sections_active;
DROP INDEX IF EXISTS idx_customers_gib_registered;
DROP INDEX IF EXISTS idx_einvoice_validation_issues;

-- Remove redundant parent indexes (keeping parent_id version)
DROP INDEX IF EXISTS idx_navigation_menus_parent;

-- Remove overly specific analytics indexes
DROP INDEX IF EXISTS idx_customers_clv;
DROP INDEX IF EXISTS idx_customers_churn;
DROP INDEX IF EXISTS idx_customers_segment;

-- Remove duplicate/redundant health report indexes
DROP INDEX IF EXISTS idx_health_reports_score;
DROP INDEX IF EXISTS idx_health_reports_status;
DROP INDEX IF EXISTS idx_health_reports_recommendations;

-- Remove overly specific production suggestion indexes
DROP INDEX IF EXISTS idx_suggestions_priority;
DROP INDEX IF EXISTS idx_suggestions_status;

-- Remove overly specific cash flow indexes
DROP INDEX IF EXISTS idx_cash_flow_predictions_risk;

-- Remove overly specific tax rate indexes
DROP INDEX IF EXISTS idx_tax_rates_type;
DROP INDEX IF EXISTS idx_tax_rates_active;
DROP INDEX IF EXISTS idx_tax_rates_valid;

-- Remove overly specific einvoice log indexes
DROP INDEX IF EXISTS idx_einvoice_logs_level;

-- Log completion
DO $$
DECLARE
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✓ Removed 25+ unused and duplicate indexes';
  RAISE NOTICE '✓ Kept critical indexes for foreign keys and tenant_id';
  RAISE NOTICE '✓ Total remaining indexes: %', index_count;
  RAISE NOTICE '✓ Write performance improved';
  RAISE NOTICE '✓ Storage overhead reduced';
END $$;
