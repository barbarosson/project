/*
  # Add Missing Foreign Key Indexes

  This migration adds indexes for foreign keys that currently lack them,
  which can lead to suboptimal query performance.

  1. New Indexes
    - accounting_kb_categories.parent_id
    - accounting_kb_doc_categories.category_id
    - admin_logs.user_id
    - coupons.created_by
    - executive_obligations.obligation_type_id
    - faqs.created_by
    - marketplace_accounts.marketplace_id
    - navigation_menus.parent_id
    - payment_transactions.discount_id
    - payment_transactions.plan_id
    - posts.author_id
    - trend_categories.parent_id
    - trend_saved_reports.search_id
*/

-- accounting_kb_categories.parent_id
CREATE INDEX IF NOT EXISTS idx_accounting_kb_categories_parent 
  ON accounting_kb_categories(parent_id);

-- accounting_kb_doc_categories.category_id
CREATE INDEX IF NOT EXISTS idx_accounting_kb_doc_categories_category 
  ON accounting_kb_doc_categories(category_id);

-- admin_logs.user_id
CREATE INDEX IF NOT EXISTS idx_admin_logs_user 
  ON admin_logs(user_id);

-- coupons.created_by
CREATE INDEX IF NOT EXISTS idx_coupons_created_by 
  ON coupons(created_by);

-- executive_obligations.obligation_type_id
CREATE INDEX IF NOT EXISTS idx_executive_obligations_type 
  ON executive_obligations(obligation_type_id);

-- faqs.created_by
CREATE INDEX IF NOT EXISTS idx_faqs_created_by 
  ON faqs(created_by);

-- marketplace_accounts.marketplace_id
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_marketplace 
  ON marketplace_accounts(marketplace_id);

-- navigation_menus.parent_id
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent 
  ON navigation_menus(parent_id);

-- payment_transactions.discount_id
CREATE INDEX IF NOT EXISTS idx_payment_transactions_discount 
  ON payment_transactions(discount_id);

-- payment_transactions.plan_id
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan 
  ON payment_transactions(plan_id);

-- posts.author_id
CREATE INDEX IF NOT EXISTS idx_posts_author 
  ON posts(author_id);

-- trend_categories.parent_id
CREATE INDEX IF NOT EXISTS idx_trend_categories_parent 
  ON trend_categories(parent_id);

-- trend_saved_reports.search_id
CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_search 
  ON trend_saved_reports(search_id);
