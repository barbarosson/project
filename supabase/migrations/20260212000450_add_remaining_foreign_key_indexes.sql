/*
  # Add Remaining Foreign Key Indexes

  This migration adds the remaining foreign key indexes identified by the security scan.

  ## Changes
  - Add 46 foreign key indexes for optimal query performance
*/

-- Accounting KB Categories
CREATE INDEX IF NOT EXISTS idx_accounting_kb_categories_parent_id ON public.accounting_kb_categories(parent_id);

-- Accounting KB Change History
CREATE INDEX IF NOT EXISTS idx_accounting_kb_change_history_document_id ON public.accounting_kb_change_history(document_id);

-- Accounting KB Doc Categories
CREATE INDEX IF NOT EXISTS idx_accounting_kb_doc_categories_category_id ON public.accounting_kb_doc_categories(category_id);

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);

-- Admin Logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON public.admin_logs(user_id);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);

-- CRM Tasks
CREATE INDEX IF NOT EXISTS idx_crm_tasks_customer_id ON public.crm_tasks(customer_id);

-- Customer Interactions
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);

-- Customer Segment History
CREATE INDEX IF NOT EXISTS idx_customer_segment_history_customer_id ON public.customer_segment_history(customer_id);

-- Executive Obligations
CREATE INDEX IF NOT EXISTS idx_executive_obligations_obligation_type_id ON public.executive_obligations(obligation_type_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);

-- FAQs
CREATE INDEX IF NOT EXISTS idx_faqs_created_by ON public.faqs(created_by);

-- Invoice Line Items
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id ON public.invoice_line_items(inventory_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_branch_id ON public.invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);

-- Marketplace Accounts
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_marketplace_id ON public.marketplace_accounts(marketplace_id);

-- Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_discount_id ON public.payment_transactions(discount_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON public.payment_transactions(plan_id);

-- Plan Discounts
CREATE INDEX IF NOT EXISTS idx_plan_discounts_plan_id ON public.plan_discounts(plan_id);

-- Plan Feature Assignments
CREATE INDEX IF NOT EXISTS idx_plan_feature_assignments_feature_id ON public.plan_feature_assignments(feature_id);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);

-- Production Labor
CREATE INDEX IF NOT EXISTS idx_production_labor_production_order_id ON public.production_labor(production_order_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_branch_id ON public.projects(branch_id);

-- Proposal Line Items
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_product_id ON public.proposal_line_items(product_id);

-- Proposals
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON public.proposals(customer_id);

-- Purchase Invoice Line Items
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_product_id ON public.purchase_invoice_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_purchase_invoice_id ON public.purchase_invoice_line_items(purchase_invoice_id);

-- Purchase Invoices
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);

-- Purchase Order Items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_tenant_id ON public.purchase_order_items(tenant_id);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON public.purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);

-- Purchase Requisitions
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_product_id ON public.purchase_requisitions(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_tenant_id ON public.purchase_requisitions(tenant_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_project_id ON public.stock_movements(project_id);

-- Supplier Price History
CREATE INDEX IF NOT EXISTS idx_supplier_price_history_product_id ON public.supplier_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_price_history_supplier_id ON public.supplier_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_price_history_tenant_id ON public.supplier_price_history(tenant_id);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON public.suppliers(tenant_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);

-- Trend Categories
CREATE INDEX IF NOT EXISTS idx_trend_categories_parent_id ON public.trend_categories(parent_id);

-- Trend Saved Reports
CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_search_id ON public.trend_saved_reports(search_id);