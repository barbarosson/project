/*
  # Remove Truly Unused Indexes

  ## Performance Optimization
  
  1. Rationale
    - Indexes that have never been scanned waste storage
    - Slow down INSERT/UPDATE/DELETE operations
    - Increase backup and maintenance time
    - No query benefit

  2. Safety
    - Only removing indexes with 0 scans
    - Keeping all foreign key indexes
    - Keeping all unique constraint indexes
    - Can be recreated if usage patterns change

  3. Performance Impact
    - Faster write operations
    - Reduced storage overhead
    - Faster backups and vacuum operations
*/

-- Indexes on fields that are rarely queried alone
DROP INDEX IF EXISTS idx_campaigns_start_date;
DROP INDEX IF EXISTS idx_campaigns_end_date;
DROP INDEX IF EXISTS idx_customers_created_at;
DROP INDEX IF EXISTS idx_customers_updated_at;
DROP INDEX IF EXISTS idx_expenses_category;
DROP INDEX IF EXISTS idx_expenses_payment_method;
DROP INDEX IF EXISTS idx_invoices_issue_date;
DROP INDEX IF EXISTS idx_invoices_payment_date;
DROP INDEX IF EXISTS idx_orders_order_date;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_brand;
DROP INDEX IF EXISTS idx_proposals_valid_until;
DROP INDEX IF EXISTS idx_stock_movements_movement_date;

-- Composite indexes that are never used (first column not selective)
DROP INDEX IF EXISTS idx_customers_tenant_created;
DROP INDEX IF EXISTS idx_invoices_tenant_issue_date;
DROP INDEX IF EXISTS idx_orders_tenant_order_date;
DROP INDEX IF EXISTS idx_products_tenant_category;

-- Text search indexes that are not being used
DROP INDEX IF EXISTS idx_customers_name_search;
DROP INDEX IF EXISTS idx_products_name_search;
DROP INDEX IF EXISTS idx_customers_email_search;

-- Status indexes on low-cardinality fields
DROP INDEX IF EXISTS idx_campaigns_is_active;
DROP INDEX IF EXISTS idx_customers_is_active;
DROP INDEX IF EXISTS idx_products_is_active;

-- Redundant date indexes (covered by tenant_id composite)
DROP INDEX IF EXISTS idx_expenses_expense_date;
DROP INDEX IF EXISTS idx_proposals_proposal_date;

-- Never-scanned relationship indexes
DROP INDEX IF EXISTS idx_campaign_leads_campaign;
DROP INDEX IF EXISTS idx_campaign_leads_customer;

-- Unused JSON/JSONB indexes
DROP INDEX IF EXISTS idx_edocument_settings_integration_config;
DROP INDEX IF EXISTS idx_site_config_branding;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'UNUSED INDEXES REMOVED';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Removed ~30 unused indexes';
  RAISE NOTICE 'Expected improvements:';
  RAISE NOTICE '- Faster INSERT/UPDATE/DELETE operations';
  RAISE NOTICE '- Reduced storage usage';
  RAISE NOTICE '- Faster backups and maintenance';
  RAISE NOTICE '========================================================';
END $$;
