/*
  # Fix Security and Performance Issues - Final Cleanup

  ## Security Fixes
  1. Remove duplicate RLS policies (multiple permissive policies)
  2. Fix function search path mutability
  3. Document RLS status for reference tables
  4. Remove unused indexes to improve performance
  
  ## Changes
  - Remove duplicate RLS policies on ai_chat_history, ai_chat_threads, customer_segments
  - Remove duplicate policies on proposal_line_items, purchase_invoice_line_items, purchase_invoices
  - Fix update_campaigns_timestamp function security
  - Drop unused indexes (18 total)
  - Add comments for reference tables (turkish_banks, turkish_provinces)
*/

-- =====================================================
-- 1. Remove Duplicate RLS Policies
-- =====================================================

-- AI Chat History - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can insert own tenant ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can update own tenant ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can delete own tenant ai_chat_history" ON ai_chat_history;

-- AI Chat Threads - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Users can insert own tenant ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Users can update own tenant ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Users can delete own tenant ai_chat_threads" ON ai_chat_threads;

-- Customer Segments - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant customer_segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can insert own tenant customer_segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can update own tenant customer_segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can delete own tenant customer_segments" ON customer_segments;

-- Proposal Line Items - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant proposal_line_items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant proposal_line_items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can update own tenant proposal_line_items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant proposal_line_items" ON proposal_line_items;

-- Purchase Invoice Line Items - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant purchase_invoice_line_items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant purchase_invoice_line_items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can update own tenant purchase_invoice_line_items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant purchase_invoice_line_items" ON purchase_invoice_line_items;

-- Purchase Invoices - Remove old policies, keep optimized ones
DROP POLICY IF EXISTS "Users can select own tenant purchase_invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can insert own tenant purchase_invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase_invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can delete own tenant purchase_invoices" ON purchase_invoices;

-- =====================================================
-- 2. Fix Function Security (Search Path)
-- =====================================================

-- Drop trigger first, then recreate function with secure search_path
DROP TRIGGER IF EXISTS campaigns_updated_at_trigger ON campaigns;
DROP FUNCTION IF EXISTS update_campaigns_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_campaigns_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_campaigns_timestamp() IS 
  'Automatically updates the updated_at timestamp for campaigns. Search path is explicitly set for security.';

-- Recreate trigger
CREATE TRIGGER campaigns_updated_at_trigger
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_timestamp();

-- =====================================================
-- 3. Remove Unused Indexes (Performance Optimization)
-- =====================================================

-- These indexes have not been used and are slowing down writes
-- Foreign key indexes are automatically created by PostgreSQL

-- Invoice line items indexes (covered by FK indexes)
DROP INDEX IF EXISTS idx_invoice_line_items_inventory_id;
DROP INDEX IF EXISTS idx_invoice_line_items_product_id;

-- Invoice indexes (covered by FK indexes)
DROP INDEX IF EXISTS idx_invoices_customer_id;

-- Proposal indexes (covered by FK indexes)
DROP INDEX IF EXISTS idx_proposal_line_items_product_id;
DROP INDEX IF EXISTS idx_proposals_customer_id;
DROP INDEX IF EXISTS idx_proposals_tenant_proposal_number;

-- Purchase invoice indexes (covered by FK indexes)
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_product_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_purchase_invoice_id;
DROP INDEX IF EXISTS idx_purchase_invoices_supplier_id;

-- Transaction indexes (not being used in current queries)
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP INDEX IF EXISTS idx_transactions_customer_id;

-- Customer and inventory indexes (not used)
DROP INDEX IF EXISTS idx_customers_tenant_type;
DROP INDEX IF EXISTS idx_inventory_stock_quantity;
DROP INDEX IF EXISTS idx_products_stock_quantity;

-- Transaction date/reference indexes (created but not used yet)
DROP INDEX IF EXISTS idx_transactions_reference;
DROP INDEX IF EXISTS idx_transactions_date_range;

-- Invoice auto-fill indexes (created but not implemented yet in frontend)
DROP INDEX IF EXISTS idx_invoices_customer_latest;
DROP INDEX IF EXISTS idx_invoices_tenant_latest;

-- =====================================================
-- 4. Add Comments for Reference Tables
-- =====================================================

COMMENT ON TABLE turkish_banks IS 
  'Reference table for Turkish banks. Public access without RLS is intentional - this is read-only reference data. SWIFT codes are publicly available information.';

COMMENT ON TABLE turkish_provinces IS 
  'Reference table for Turkish provinces. Public access without RLS is intentional - this is read-only reference data.';

COMMENT ON COLUMN turkish_banks.swift_code IS 
  'SWIFT/BIC code - publicly available information used for international banking. Not considered sensitive as these are published by banks.';

-- Grant read-only access to anonymous users for reference tables
GRANT SELECT ON turkish_banks TO anon;
GRANT SELECT ON turkish_provinces TO anon;

-- Ensure no write access for anonymous users
REVOKE INSERT, UPDATE, DELETE ON turkish_banks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON turkish_provinces FROM anon;

-- =====================================================
-- 5. Performance Analysis Note
-- =====================================================

/*
  Index Removal Rationale:
  
  1. Foreign Key Indexes: PostgreSQL automatically creates indexes for foreign keys
     on the referencing side. Our manual indexes were duplicates.
     
  2. Unused Composite Indexes: Indexes like idx_customers_tenant_type were created
     for potential queries but are not being used by the current application.
     
  3. Premature Optimization: Some indexes (invoice auto-fill) were created for 
     features not yet implemented in the frontend.
     
  Performance Impact:
  - Reduced write overhead (no need to update 18 unused indexes)
  - Reduced storage requirements
  - Faster INSERT/UPDATE/DELETE operations
  - No impact on read performance (queries weren't using these indexes)
  
  Future Considerations:
  - If invoice auto-fill is implemented, recreate idx_invoices_customer_latest
  - If date range filtering on transactions becomes common, recreate idx_transactions_date_range
  - Monitor query performance and add indexes as needed based on actual usage patterns
*/

-- =====================================================
-- 6. Security Summary
-- =====================================================

/*
  Security Status After This Migration:
  
  ✅ Fixed: Multiple permissive policies removed (6 tables cleaned up)
  ✅ Fixed: Function search path made immutable
  ✅ Fixed: Unused indexes removed (performance improvement)
  ✅ Documented: Reference tables RLS status explained
  ✅ Documented: SWIFT codes are public information
  
  ⚠️  Manual Action Required (via Supabase Dashboard):
  - Enable "Leaked Password Protection" in Auth settings
  - Go to: Dashboard → Authentication → Settings
  - Enable: "Block users with compromised passwords"
  
  📊 Performance Improvements:
  - 18 unused indexes removed
  - Write operations will be faster
  - Storage usage reduced
  - No negative impact on read queries
*/
