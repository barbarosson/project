/*
  # Remove Unused Indexes - Performance Optimization

  1. Issue
    - 40+ indexes that are never used
    - Waste storage space
    - Slow down INSERT/UPDATE operations
    
  2. Solution
    - Drop unused indexes
    - Improve write performance
    - Reduce storage footprint

  Note: These indexes have been confirmed as unused by Supabase analytics
*/

-- Accounting indexes
DROP INDEX IF EXISTS idx_accounting_kb_categories_parent;
DROP INDEX IF EXISTS idx_accounting_kb_doc_categories_category;

-- Admin indexes
DROP INDEX IF EXISTS idx_admin_logs_user;
DROP INDEX IF EXISTS idx_coupons_created_by;
DROP INDEX IF EXISTS idx_faqs_created_by;
DROP INDEX IF EXISTS idx_posts_author;

-- Executive & Obligations
DROP INDEX IF EXISTS idx_executive_obligations_type;

-- Marketplace indexes
DROP INDEX IF EXISTS idx_marketplace_accounts_marketplace;

-- Navigation
DROP INDEX IF EXISTS idx_navigation_menus_parent;

-- Payment & Pricing
DROP INDEX IF EXISTS idx_payment_transactions_discount;
DROP INDEX IF EXISTS idx_payment_transactions_plan;

-- Trend Agent
DROP INDEX IF EXISTS idx_trend_categories_parent;
DROP INDEX IF EXISTS idx_trend_saved_reports_search;

-- Supplier indexes (replaced by better ones)
DROP INDEX IF EXISTS idx_suppliers_tenant;
DROP INDEX IF EXISTS idx_suppliers_status;
DROP INDEX IF EXISTS idx_suppliers_rating;

-- Purchase Order indexes (replaced by better ones)
DROP INDEX IF EXISTS idx_po_tenant;
DROP INDEX IF EXISTS idx_po_supplier;
DROP INDEX IF EXISTS idx_po_status;
DROP INDEX IF EXISTS idx_po_branch;
DROP INDEX IF EXISTS idx_po_project;
DROP INDEX IF EXISTS idx_po_order_date;
DROP INDEX IF EXISTS idx_po_number;

-- Purchase Order Items indexes
DROP INDEX IF EXISTS idx_po_items_tenant;
DROP INDEX IF EXISTS idx_po_items_po;
DROP INDEX IF EXISTS idx_po_items_product;

-- Purchase Requisitions indexes
DROP INDEX IF EXISTS idx_requisitions_tenant;
DROP INDEX IF EXISTS idx_requisitions_status;
DROP INDEX IF EXISTS idx_requisitions_priority;
DROP INDEX IF EXISTS idx_requisitions_product;

-- Supplier Price History indexes
DROP INDEX IF EXISTS idx_price_history_tenant;
DROP INDEX IF EXISTS idx_price_history_supplier;
DROP INDEX IF EXISTS idx_price_history_product;
DROP INDEX IF EXISTS idx_price_history_date;

-- Duplicate indexes (already created in earlier migration)
DROP INDEX IF EXISTS idx_order_items_demand;
DROP INDEX IF EXISTS idx_expenses_project_link;
DROP INDEX IF EXISTS idx_invoices_cash_due;
DROP INDEX IF EXISTS idx_po_cash_expected;
DROP INDEX IF EXISTS idx_projects_actual_cost;
