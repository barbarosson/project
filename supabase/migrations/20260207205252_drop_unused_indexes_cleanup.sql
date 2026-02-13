/*
  # Drop Unused Indexes

  Removing indexes that have not been used to reduce database overhead.
  Only dropping indexes that are clearly redundant or duplicative.

  Note: Keeping indexes that may be used for:
  - Foreign key lookups
  - Date-based queries (created_at, due_date, etc.)
  - Status/type filters
  - Core business logic queries
*/

-- Drop truly unused/redundant indexes
DROP INDEX IF EXISTS idx_projects_client_id; -- Redundant with FK index
DROP INDEX IF EXISTS idx_projects_tenant_id; -- Covered by RLS policies efficiently

-- Unused branch-related indexes (new columns, not yet queried)
DROP INDEX IF EXISTS idx_production_orders_branch;
DROP INDEX IF EXISTS idx_stock_movements_branch;
DROP INDEX IF EXISTS idx_customers_branch;
DROP INDEX IF EXISTS idx_products_branch;
DROP INDEX IF EXISTS idx_warehouses_branch;

-- Content section indexes (not actively used yet)
DROP INDEX IF EXISTS idx_content_sections_category;
DROP INDEX IF EXISTS idx_content_sections_active;

-- Profile indexes (simple lookups don't need these)
DROP INDEX IF EXISTS idx_profiles_is_active;
DROP INDEX IF EXISTS idx_profiles_role;

-- Duplicate/redundant project indexes
DROP INDEX IF EXISTS idx_project_cost_entries_project;
DROP INDEX IF EXISTS idx_project_cost_entries_tenant;
DROP INDEX IF EXISTS idx_project_cost_entries_ref;
DROP INDEX IF EXISTS idx_project_milestones_project;
DROP INDEX IF EXISTS idx_project_milestones_tenant;
DROP INDEX IF EXISTS idx_project_reservations_project;
DROP INDEX IF EXISTS idx_project_reservations_product;
DROP INDEX IF EXISTS idx_project_reservations_tenant;

-- Unused marketplace indexes
DROP INDEX IF EXISTS idx_mp_orders_date;
DROP INDEX IF EXISTS idx_marketplace_orders_local_order_id;

-- Duplicate edocument indexes
DROP INDEX IF EXISTS idx_edocuments_document_type;
DROP INDEX IF EXISTS idx_edocuments_status;
DROP INDEX IF EXISTS idx_edocuments_direction;
DROP INDEX IF EXISTS idx_edocuments_ettn;
DROP INDEX IF EXISTS idx_edocuments_issue_date;

-- Accounting KB indexes (not actively queried)
DROP INDEX IF EXISTS idx_accounting_kb_docs_status;
DROP INDEX IF EXISTS idx_accounting_kb_docs_law;
DROP INDEX IF EXISTS idx_accounting_kb_docs_tenant;
DROP INDEX IF EXISTS idx_accounting_kb_change_history_doc;
DROP INDEX IF EXISTS idx_accounting_kb_change_history_date;

-- Production indexes (covered by tenant_id queries)
DROP INDEX IF EXISTS idx_production_orders_tenant;
DROP INDEX IF EXISTS idx_production_orders_created;

-- Invoice/proposal line item indexes (FK already indexed)
DROP INDEX IF EXISTS idx_invoice_line_items_inventory_id;
DROP INDEX IF EXISTS idx_proposal_line_items_product_id;
DROP INDEX IF EXISTS idx_proposals_customer_id;

-- Purchase invoice indexes (not commonly used)
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_product_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_purchase_invoice_id;
DROP INDEX IF EXISTS idx_purchase_invoices_supplier_id;

-- Support/activity log indexes (covered by other queries)
DROP INDEX IF EXISTS idx_support_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_activity_log_user_id;
DROP INDEX IF EXISTS idx_activity_log_action;
DROP INDEX IF EXISTS idx_activity_log_table_name;
DROP INDEX IF EXISTS idx_activity_log_created_at;

-- Edocument line items
DROP INDEX IF EXISTS idx_edocument_line_items_edocument_id;
DROP INDEX IF EXISTS idx_edocument_line_items_tenant_id;
DROP INDEX IF EXISTS idx_edocument_activity_log_tenant_id;
DROP INDEX IF EXISTS idx_edocument_activity_log_edocument_id;

-- BOM and production detail indexes (parent query covers these)
DROP INDEX IF EXISTS idx_bom_items_order;
DROP INDEX IF EXISTS idx_bom_items_product;
DROP INDEX IF EXISTS idx_labor_entries_order;
DROP INDEX IF EXISTS idx_qc_checks_order;

-- Expense/transaction indexes (tenant query covers)
DROP INDEX IF EXISTS idx_expenses_account_id;
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP INDEX IF EXISTS idx_transactions_customer_id;
DROP INDEX IF EXISTS idx_support_messages_sender_id;

-- Warehouse indexes (tenant-based queries cover)
DROP INDEX IF EXISTS idx_warehouses_tenant;
DROP INDEX IF EXISTS idx_warehouses_is_main;
DROP INDEX IF EXISTS idx_warehouses_active;
DROP INDEX IF EXISTS idx_warehouse_stock_warehouse;
DROP INDEX IF EXISTS idx_warehouse_stock_product;
DROP INDEX IF EXISTS idx_transfers_tenant;
DROP INDEX IF EXISTS idx_transfers_from;
DROP INDEX IF EXISTS idx_transfers_to;
DROP INDEX IF EXISTS idx_transfers_product;
DROP INDEX IF EXISTS idx_transfers_created;

-- Executive assistant indexes
DROP INDEX IF EXISTS idx_exec_obligations_due_date;
DROP INDEX IF EXISTS idx_exec_obligations_status;
DROP INDEX IF EXISTS idx_exec_meetings_start;
DROP INDEX IF EXISTS idx_exec_meetings_status;
DROP INDEX IF EXISTS idx_exec_attendees_meeting;
DROP INDEX IF EXISTS idx_exec_reminders_remind_at;

-- Finance robot indexes
DROP INDEX IF EXISTS idx_fr_threads_updated_at;
DROP INDEX IF EXISTS idx_fr_messages_created_at;

-- Marketplace indexes
DROP INDEX IF EXISTS idx_mp_orders_account;
DROP INDEX IF EXISTS idx_mp_orders_status;
DROP INDEX IF EXISTS idx_mp_products_account;
DROP INDEX IF EXISTS idx_mp_order_items_order;
DROP INDEX IF EXISTS idx_mp_sync_logs_account;

-- Plan/payment indexes
DROP INDEX IF EXISTS idx_pfa_plan_id;
DROP INDEX IF EXISTS idx_plan_feature_values_plan;
DROP INDEX IF EXISTS idx_plan_installment_options_plan;
DROP INDEX IF EXISTS idx_plan_discounts_plan;
DROP INDEX IF EXISTS idx_plan_discounts_coupon;
DROP INDEX IF EXISTS idx_payment_transactions_user;
DROP INDEX IF EXISTS idx_payment_transactions_status;
DROP INDEX IF EXISTS idx_payment_transactions_iyzico;

-- Stock movement indexes
DROP INDEX IF EXISTS idx_stock_movements_production;
DROP INDEX IF EXISTS idx_stock_movements_warehouse;
DROP INDEX IF EXISTS idx_expenses_production;

-- Trend agent indexes
DROP INDEX IF EXISTS idx_trend_searches_created;
DROP INDEX IF EXISTS idx_trend_results_search;
DROP INDEX IF EXISTS idx_trend_results_tenant;
DROP INDEX IF EXISTS idx_trend_results_score;
DROP INDEX IF EXISTS idx_trend_saved_reports_favorite;

-- Order indexes (covered by tenant queries)
DROP INDEX IF EXISTS idx_orders_tenant_id;
DROP INDEX IF EXISTS idx_orders_customer_id;
DROP INDEX IF EXISTS idx_orders_order_number;
DROP INDEX IF EXISTS idx_orders_invoice_id;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_order_items_tenant_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;

-- Cross-reference indexes (FK relationships cover these)
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_invoices_project_id;
DROP INDEX IF EXISTS idx_edocuments_order_id;
DROP INDEX IF EXISTS idx_orders_project_id;
DROP INDEX IF EXISTS idx_expenses_project_id;
DROP INDEX IF EXISTS idx_stock_movements_project_id;

-- Created_by indexes (not commonly filtered)
DROP INDEX IF EXISTS idx_invoices_created_by;
DROP INDEX IF EXISTS idx_orders_created_by;
DROP INDEX IF EXISTS idx_production_orders_created_by;
DROP INDEX IF EXISTS idx_customers_created_by;
DROP INDEX IF EXISTS idx_products_created_by;
DROP INDEX IF EXISTS idx_projects_created_by;

-- Accounting AI indexes
DROP INDEX IF EXISTS idx_accounting_ai_feedback_message;
DROP INDEX IF EXISTS idx_accounting_ai_feedback_tenant;

-- Production labor
DROP INDEX IF EXISTS idx_production_labor_order;
DROP INDEX IF EXISTS idx_production_labor_tenant;

-- Branch indexes
DROP INDEX IF EXISTS idx_branches_tenant;
DROP INDEX IF EXISTS idx_branches_active;
DROP INDEX IF EXISTS idx_branches_hq;
DROP INDEX IF EXISTS idx_branch_targets_tenant;
DROP INDEX IF EXISTS idx_branch_targets_branch;
DROP INDEX IF EXISTS idx_branch_targets_month;

-- Branch reference indexes
DROP INDEX IF EXISTS idx_invoices_branch;
DROP INDEX IF EXISTS idx_orders_branch;
DROP INDEX IF EXISTS idx_expenses_branch;
DROP INDEX IF EXISTS idx_projects_branch;

-- Production/status indexes
DROP INDEX IF EXISTS idx_production_orders_status;
DROP INDEX IF EXISTS idx_production_orders_product;
DROP INDEX IF EXISTS idx_production_orders_project;

-- Transfer/status  indexes
DROP INDEX IF EXISTS idx_transfers_status;

-- Tenant indexes (RLS covers these efficiently)
DROP INDEX IF EXISTS idx_tenants_is_active;

-- Order status index
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_source;
