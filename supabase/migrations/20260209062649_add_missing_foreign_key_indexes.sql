/*
  # Add Missing Foreign Key Indexes

  1. Issue
    - 26 foreign key columns without covering indexes
    - Causes suboptimal JOIN performance
    
  2. Solution
    - Add index for each unindexed foreign key column
    - Improves query performance at scale
*/

-- accounting_kb_categories
CREATE INDEX IF NOT EXISTS idx_accounting_kb_categories_parent_id 
  ON accounting_kb_categories(parent_id);

-- accounting_kb_doc_categories
CREATE INDEX IF NOT EXISTS idx_accounting_kb_doc_categories_category_id 
  ON accounting_kb_doc_categories(category_id);

-- admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id 
  ON admin_logs(user_id);

-- coupons
CREATE INDEX IF NOT EXISTS idx_coupons_created_by 
  ON coupons(created_by);

-- executive_obligations
CREATE INDEX IF NOT EXISTS idx_executive_obligations_obligation_type_id 
  ON executive_obligations(obligation_type_id);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_project_id 
  ON expenses(project_id);

-- faqs
CREATE INDEX IF NOT EXISTS idx_faqs_created_by 
  ON faqs(created_by);

-- marketplace_accounts
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_marketplace_id 
  ON marketplace_accounts(marketplace_id);

-- navigation_menus
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent_id 
  ON navigation_menus(parent_id);

-- payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_discount_id 
  ON payment_transactions(discount_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id 
  ON payment_transactions(plan_id);

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_author_id 
  ON posts(author_id);

-- purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id 
  ON purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id 
  ON purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_tenant_id 
  ON purchase_order_items(tenant_id);

-- purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id 
  ON purchase_orders(branch_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id 
  ON purchase_orders(project_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id 
  ON purchase_orders(supplier_id);

-- purchase_requisitions
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_product_id 
  ON purchase_requisitions(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_tenant_id 
  ON purchase_requisitions(tenant_id);

-- supplier_price_history
CREATE INDEX IF NOT EXISTS idx_supplier_price_history_product_id 
  ON supplier_price_history(product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_price_history_supplier_id 
  ON supplier_price_history(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_price_history_tenant_id 
  ON supplier_price_history(tenant_id);

-- suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id 
  ON suppliers(tenant_id);

-- trend_categories
CREATE INDEX IF NOT EXISTS idx_trend_categories_parent_id 
  ON trend_categories(parent_id);

-- trend_saved_reports
CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_search_id 
  ON trend_saved_reports(search_id);
