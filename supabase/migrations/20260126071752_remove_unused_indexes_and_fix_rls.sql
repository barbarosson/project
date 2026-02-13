/*
  # Remove Unused Indexes and Fix RLS Policies
  
  ## Part 1: Drop Unused Indexes
  Unused indexes waste storage space and slow down INSERT/UPDATE operations.
  These indexes have never been used according to Supabase performance report.
  
  ## Part 2: Add Missing RLS Policies
  Several tables have RLS enabled but no policies, making them completely inaccessible.
  Adding proper tenant-based policies using the optimized (select auth.uid()) pattern.
  
  ## Impact
  - ✅ Reduces database storage usage
  - ✅ Improves write performance (INSERT/UPDATE)
  - ✅ Fixes tables that are currently inaccessible
  - ✅ Maintains proper security with RLS
*/

-- =====================================================
-- PART 1: DROP ALL UNUSED INDEXES
-- =====================================================

-- Simple Transactions (old table)
DROP INDEX IF EXISTS idx_transactions_tenant_id;

-- Customers
DROP INDEX IF EXISTS idx_customers_tax_number;
DROP INDEX IF EXISTS idx_customers_tenant_id;
DROP INDEX IF EXISTS idx_customers_tenant_status;

-- Inventory
DROP INDEX IF EXISTS idx_inventory_tenant_id;

-- Invoice Line Items
DROP INDEX IF EXISTS idx_invoice_line_items_inventory_id;
DROP INDEX IF EXISTS idx_invoice_line_items_tenant_id;
DROP INDEX IF EXISTS idx_invoice_line_items_product_id;

-- Invoices
DROP INDEX IF EXISTS idx_invoices_tenant_id;
DROP INDEX IF EXISTS idx_invoices_customer_id;
DROP INDEX IF EXISTS idx_invoices_tenant_status;
DROP INDEX IF EXISTS idx_invoices_customer;

-- Purchase Invoices
DROP INDEX IF EXISTS idx_purchase_invoices_tenant_id;
DROP INDEX IF EXISTS idx_purchase_invoices_supplier_id;
DROP INDEX IF EXISTS idx_purchase_invoices_status;
DROP INDEX IF EXISTS idx_purchase_invoices_date;

-- Purchase Invoice Line Items
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_tenant_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_invoice_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_product_id;

-- Stock Movements
DROP INDEX IF EXISTS idx_stock_movements_created_at;
DROP INDEX IF EXISTS idx_stock_movements_tenant_id;

-- Expenses
DROP INDEX IF EXISTS idx_expenses_tenant_id;
DROP INDEX IF EXISTS idx_expenses_category;
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_expenses_tenant_date;

-- Proposals
DROP INDEX IF EXISTS idx_proposals_customer_id;
DROP INDEX IF EXISTS idx_proposals_status;
DROP INDEX IF EXISTS idx_proposals_tenant_id;

-- Proposal Line Items
DROP INDEX IF EXISTS idx_proposal_line_items_tenant_id;
DROP INDEX IF EXISTS idx_proposal_line_items_product_id;

-- Campaigns
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_tenant_id;

-- Customer Segments
DROP INDEX IF EXISTS idx_customer_segments_customer_id;
DROP INDEX IF EXISTS idx_customer_segments_segment;
DROP INDEX IF EXISTS idx_customer_segments_tenant_id;

-- Support Tickets
DROP INDEX IF EXISTS idx_support_tickets_tenant_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_created_at;

-- Products
DROP INDEX IF EXISTS idx_products_stock_status;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_tenant_id;
DROP INDEX IF EXISTS idx_products_purchase_price;
DROP INDEX IF EXISTS idx_products_sale_price;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_products_tenant_stock;
DROP INDEX IF EXISTS idx_products_tenant;

-- AI Chat
DROP INDEX IF EXISTS idx_ai_chat_threads_updated_at;
DROP INDEX IF EXISTS idx_ai_chat_history_created_at;

-- Notifications
DROP INDEX IF EXISTS idx_notifications_tenant_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_tenant_unread;

-- Accounts
DROP INDEX IF EXISTS idx_accounts_tenant_id;
DROP INDEX IF EXISTS idx_accounts_type;
DROP INDEX IF EXISTS idx_accounts_is_active;

-- Transactions
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_reference;
DROP INDEX IF EXISTS idx_transactions_customer;
DROP INDEX IF EXISTS idx_transactions_tenant_date;
DROP INDEX IF EXISTS idx_transactions_account;

-- =====================================================
-- PART 2: ADD MISSING RLS POLICIES
-- =====================================================

-- AI_CHAT_THREADS
CREATE POLICY "Authenticated manage ai_chat_threads"
  ON ai_chat_threads
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- AI_CHAT_HISTORY
CREATE POLICY "Authenticated manage ai_chat_history"
  ON ai_chat_history
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- CUSTOMER_SEGMENTS
CREATE POLICY "Authenticated manage customer_segments"
  ON customer_segments
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- PROPOSAL_LINE_ITEMS
CREATE POLICY "Authenticated manage proposal_line_items"
  ON proposal_line_items
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- PURCHASE_INVOICES
CREATE POLICY "Authenticated manage purchase_invoices"
  ON purchase_invoices
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- PURCHASE_INVOICE_LINE_ITEMS
CREATE POLICY "Authenticated manage purchase_invoice_line_items"
  ON purchase_invoice_line_items
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- SIMPLE_TRANSACTIONS (old table - add policy so it doesn't break anything)
CREATE POLICY "Authenticated manage simple_transactions"
  ON simple_transactions
  FOR ALL
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

-- =====================================================
-- VERIFICATION
-- =====================================================

-- All unused indexes have been dropped
-- All tables with RLS enabled now have proper policies
-- Using optimized (select auth.uid()) pattern for better performance
