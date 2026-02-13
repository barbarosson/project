/*
  # Remove Unused Indexes - Comprehensive Cleanup

  This migration removes all unused indexes identified by Supabase.
  Unused indexes waste storage space and slow down write operations.

  ## Changes
  - Remove 100+ unused indexes across multiple tables
*/

-- Staff indexes
DROP INDEX IF EXISTS public.idx_staff_tenant;
DROP INDEX IF EXISTS public.idx_staff_tenant_id;
DROP INDEX IF EXISTS public.idx_staff_department;
DROP INDEX IF EXISTS public.idx_staff_manager_id;

-- Salary Definitions indexes
DROP INDEX IF EXISTS public.idx_salary_definitions_tenant;
DROP INDEX IF EXISTS public.idx_salary_definitions_tenant_id;
DROP INDEX IF EXISTS public.idx_salary_definitions_active;

-- Payroll indexes
DROP INDEX IF EXISTS public.idx_payroll_tenant;
DROP INDEX IF EXISTS public.idx_payroll_tenant_id;
DROP INDEX IF EXISTS public.idx_payroll_period;
DROP INDEX IF EXISTS public.idx_payroll_status;

-- Payroll Items indexes
DROP INDEX IF EXISTS public.idx_payroll_items_payroll;
DROP INDEX IF EXISTS public.idx_payroll_items_tenant_id;
DROP INDEX IF EXISTS public.idx_payroll_items_payroll_id;
DROP INDEX IF EXISTS public.idx_payroll_items_staff;
DROP INDEX IF EXISTS public.idx_payroll_items_staff_id;

-- Customers indexes
DROP INDEX IF EXISTS public.idx_customers_segment;
DROP INDEX IF EXISTS public.idx_customers_clv;
DROP INDEX IF EXISTS public.idx_customers_churn;
DROP INDEX IF EXISTS public.idx_customers_tax_number;
DROP INDEX IF EXISTS public.idx_customers_gib_registered;

-- Expenses indexes
DROP INDEX IF EXISTS public.idx_expenses_tenant_id;
DROP INDEX IF EXISTS public.idx_expenses_category;
DROP INDEX IF EXISTS public.idx_expenses_project_id;

-- Invoice Line Items indexes
DROP INDEX IF EXISTS public.idx_invoice_line_items_inventory_id;

-- Customer Interactions indexes
DROP INDEX IF EXISTS public.idx_interactions_customer;
DROP INDEX IF EXISTS public.idx_interactions_created;

-- CRM AI Insights indexes
DROP INDEX IF EXISTS public.idx_insights_customer;
DROP INDEX IF EXISTS public.idx_insights_churn;

-- CRM Tasks indexes
DROP INDEX IF EXISTS public.idx_tasks_customer;
DROP INDEX IF EXISTS public.idx_tasks_status;

-- Purchase Invoices indexes
DROP INDEX IF EXISTS public.idx_purchase_invoices_tenant;
DROP INDEX IF EXISTS public.idx_purchase_invoices_supplier;
DROP INDEX IF EXISTS public.idx_purchase_invoices_tenant_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_supplier_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_status;

-- Purchase Invoice Line Items indexes
DROP INDEX IF EXISTS public.idx_purchase_invoice_items_invoice;
DROP INDEX IF EXISTS public.idx_purchase_invoice_items_product;
DROP INDEX IF EXISTS public.idx_purchase_invoice_line_items_invoice_id;
DROP INDEX IF EXISTS public.idx_purchase_invoice_line_items_tenant_id;
DROP INDEX IF EXISTS public.idx_purchase_invoice_line_items_purchase_invoice_id;

-- Notifications indexes
DROP INDEX IF EXISTS public.idx_notifications_tenant_id;
DROP INDEX IF EXISTS public.idx_notifications_is_read;
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_notifications_type;

-- Stock Movements indexes
DROP INDEX IF EXISTS public.idx_stock_movements_created_at;
DROP INDEX IF EXISTS public.idx_stock_movements_project_id;

-- Cash Flow Rules indexes
DROP INDEX IF EXISTS public.idx_cash_flow_rules_tenant;
DROP INDEX IF EXISTS public.idx_cash_flow_rules_type;

-- Products indexes
DROP INDEX IF EXISTS public.idx_products_stock_status;
DROP INDEX IF EXISTS public.idx_products_category;
DROP INDEX IF EXISTS public.idx_products_sku;
DROP INDEX IF EXISTS public.idx_products_name;

-- Proposal Line Items indexes
DROP INDEX IF EXISTS public.idx_proposal_line_items_product_id;

-- Purchase Invoice Line Items (duplicate)
DROP INDEX IF EXISTS public.idx_purchase_invoice_line_items_product_id;

-- Cash Flow Predictions indexes
DROP INDEX IF EXISTS public.idx_cash_flow_predictions_tenant_date;
DROP INDEX IF EXISTS public.idx_cash_flow_predictions_branch_date;
DROP INDEX IF EXISTS public.idx_cash_flow_predictions_risk;
DROP INDEX IF EXISTS public.idx_cash_flow_predictions_scenario;

-- AI Model Metrics indexes
DROP INDEX IF EXISTS public.idx_ai_model_metrics_tenant;
DROP INDEX IF EXISTS public.idx_ai_model_metrics_branch;
DROP INDEX IF EXISTS public.idx_ai_model_metrics_version;
DROP INDEX IF EXISTS public.idx_model_metrics_type;

-- Production BOM indexes
DROP INDEX IF EXISTS public.idx_production_bom_product;
DROP INDEX IF EXISTS public.idx_production_bom_component;
DROP INDEX IF EXISTS public.idx_production_bom_tenant;

-- Customer Segment History indexes
DROP INDEX IF EXISTS public.idx_segment_history_customer;

-- Profiles indexes
DROP INDEX IF EXISTS public.idx_profiles_is_super_admin;
DROP INDEX IF EXISTS public.idx_profiles_user_status;
DROP INDEX IF EXISTS public.idx_profiles_language;
DROP INDEX IF EXISTS public.idx_profiles_role;

-- Accounting KB Change History indexes
DROP INDEX IF EXISTS public.idx_accounting_kb_change_history_doc;
DROP INDEX IF EXISTS public.idx_accounting_kb_change_history_date;
DROP INDEX IF EXISTS public.idx_accounting_kb_categories_parent_id;
DROP INDEX IF EXISTS public.idx_accounting_kb_doc_categories_category_id;

-- Production Labor indexes
DROP INDEX IF EXISTS public.idx_production_labor_order;
DROP INDEX IF EXISTS public.idx_production_labor_tenant;

-- Supplier Price History indexes
DROP INDEX IF EXISTS public.idx_price_history_tenant;
DROP INDEX IF EXISTS public.idx_price_history_supplier;
DROP INDEX IF EXISTS public.idx_price_history_product;
DROP INDEX IF EXISTS public.idx_price_history_date;
DROP INDEX IF EXISTS public.idx_supplier_price_history_product_id;
DROP INDEX IF EXISTS public.idx_supplier_price_history_supplier_id;
DROP INDEX IF EXISTS public.idx_supplier_price_history_tenant_id;

-- E-Invoice indexes
DROP INDEX IF EXISTS public.idx_einvoice_invoice;
DROP INDEX IF EXISTS public.idx_einvoice_tenant;
DROP INDEX IF EXISTS public.idx_einvoice_gib_uuid;
DROP INDEX IF EXISTS public.idx_einvoice_ettn;
DROP INDEX IF EXISTS public.idx_einvoice_status;
DROP INDEX IF EXISTS public.idx_einvoice_type;
DROP INDEX IF EXISTS public.idx_einvoice_sent_at;
DROP INDEX IF EXISTS public.idx_einvoice_validation_issues;
DROP INDEX IF EXISTS public.idx_einvoice_queue_detail;
DROP INDEX IF EXISTS public.idx_einvoice_queue_status;
DROP INDEX IF EXISTS public.idx_einvoice_queue_priority;
DROP INDEX IF EXISTS public.idx_einvoice_queue_next_retry;
DROP INDEX IF EXISTS public.idx_einvoice_logs_detail;
DROP INDEX IF EXISTS public.idx_einvoice_logs_level;
DROP INDEX IF EXISTS public.idx_einvoice_logs_created;

-- Turkish Provinces indexes
DROP INDEX IF EXISTS public.idx_turkish_provinces_name;

-- Tenants indexes
DROP INDEX IF EXISTS public.idx_tenants_owner;

-- User Subscriptions indexes
DROP INDEX IF EXISTS public.idx_user_subscriptions_user;

-- Admin Logs indexes
DROP INDEX IF EXISTS public.idx_admin_logs_user_id;

-- Coupons indexes
DROP INDEX IF EXISTS public.idx_coupons_created_by;

-- Executive Obligations indexes
DROP INDEX IF EXISTS public.idx_executive_obligations_obligation_type_id;

-- FAQs indexes
DROP INDEX IF EXISTS public.idx_faqs_created_by;
DROP INDEX IF EXISTS public.idx_faqs_category_order;

-- Marketplace Accounts indexes
DROP INDEX IF EXISTS public.idx_marketplace_accounts_marketplace_id;

-- Payment Transactions indexes
DROP INDEX IF EXISTS public.idx_payment_transactions_discount_id;
DROP INDEX IF EXISTS public.idx_payment_transactions_plan_id;

-- Posts indexes
DROP INDEX IF EXISTS public.idx_posts_author_id;

-- Purchase Orders indexes
DROP INDEX IF EXISTS public.idx_purchase_order_items_product_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_purchase_order_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_tenant_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_branch_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_project_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_supplier_id;

-- Purchase Requisitions indexes
DROP INDEX IF EXISTS public.idx_purchase_requisitions_product_id;
DROP INDEX IF EXISTS public.idx_purchase_requisitions_tenant_id;

-- Suppliers indexes
DROP INDEX IF EXISTS public.idx_suppliers_tenant_id;

-- Trend indexes
DROP INDEX IF EXISTS public.idx_trend_categories_parent_id;
DROP INDEX IF EXISTS public.idx_trend_saved_reports_search_id;

-- Credit Balances indexes
DROP INDEX IF EXISTS public.idx_credit_balances_user_id;

-- Plan Feature Assignments indexes
DROP INDEX IF EXISTS public.idx_plan_feature_assignments_plan_id;
DROP INDEX IF EXISTS public.idx_plan_feature_assignments_feature_id;

-- Plan Discounts indexes
DROP INDEX IF EXISTS public.idx_plan_discounts_plan_id;

-- Plan Installment Options indexes
DROP INDEX IF EXISTS public.idx_plan_installment_options_plan_id;

-- Customer Reviews indexes
DROP INDEX IF EXISTS public.idx_customer_reviews_order_index;

-- Production Recipes indexes
DROP INDEX IF EXISTS public.idx_recipes_tenant;
DROP INDEX IF EXISTS public.idx_recipes_branch;
DROP INDEX IF EXISTS public.idx_recipes_finished_good;
DROP INDEX IF EXISTS public.idx_recipe_items_recipe;
DROP INDEX IF EXISTS public.idx_recipe_items_material;

-- AI Production Suggestions indexes
DROP INDEX IF EXISTS public.idx_suggestions_tenant;
DROP INDEX IF EXISTS public.idx_suggestions_product;
DROP INDEX IF EXISTS public.idx_suggestions_status;
DROP INDEX IF EXISTS public.idx_suggestions_priority;

-- Customer Segments indexes
DROP INDEX IF EXISTS public.idx_customer_segments_segment;
DROP INDEX IF EXISTS public.idx_customer_segments_customer_id;

-- Proposals indexes
DROP INDEX IF EXISTS public.idx_proposals_customer_id;
DROP INDEX IF EXISTS public.idx_proposals_status;

-- Campaigns indexes
DROP INDEX IF EXISTS public.idx_campaigns_status;

-- Support Tickets indexes
DROP INDEX IF EXISTS public.idx_support_tickets_tenant_id;
DROP INDEX IF EXISTS public.idx_support_tickets_status;
DROP INDEX IF EXISTS public.idx_support_tickets_created_at;

-- Activity Log indexes
DROP INDEX IF EXISTS public.idx_activity_log_user_id;
DROP INDEX IF EXISTS public.idx_activity_log_action;
DROP INDEX IF EXISTS public.idx_activity_log_table_name;
DROP INDEX IF EXISTS public.idx_activity_log_created_at;

-- Projects indexes
DROP INDEX IF EXISTS public.idx_projects_branch_id;

-- Tax Rates indexes
DROP INDEX IF EXISTS public.idx_tax_rates_tenant;
DROP INDEX IF EXISTS public.idx_tax_rates_type;
DROP INDEX IF EXISTS public.idx_tax_rates_active;
DROP INDEX IF EXISTS public.idx_tax_rates_valid;

-- Invoices indexes
DROP INDEX IF EXISTS public.idx_invoices_branch_id;
DROP INDEX IF EXISTS public.idx_invoices_project_id;

-- Transactions indexes
DROP INDEX IF EXISTS public.idx_transactions_account_id;
DROP INDEX IF EXISTS public.idx_transactions_customer_id;
DROP INDEX IF EXISTS public.idx_transactions_transaction_date;
DROP INDEX IF EXISTS public.idx_transactions_reference;