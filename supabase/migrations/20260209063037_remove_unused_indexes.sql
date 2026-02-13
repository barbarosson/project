/*
  # Remove Unused Indexes

  1. Issue
    - 68 indexes are not being used by queries
    - Consume disk space and slow down writes
    
  2. Solution
    - Drop all unused indexes
    - Improves write performance and reduces storage
*/

-- Project indexes
DROP INDEX IF EXISTS idx_project_milestones_project_id;
DROP INDEX IF EXISTS idx_project_reservations_product_id;
DROP INDEX IF EXISTS idx_project_reservations_project_id;
DROP INDEX IF EXISTS idx_projects_branch_id;
DROP INDEX IF EXISTS idx_projects_client_id;

-- Proposal indexes
DROP INDEX IF EXISTS idx_proposal_line_items_product_id;
DROP INDEX IF EXISTS idx_proposals_customer_id;

-- Purchase invoice indexes
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_product_id;
DROP INDEX IF EXISTS idx_purchase_invoice_line_items_purchase_invoice_id;

-- eDocument indexes
DROP INDEX IF EXISTS idx_edocument_activity_log_edocument_id;
DROP INDEX IF EXISTS idx_edocument_line_items_edocument_id;

-- Executive indexes
DROP INDEX IF EXISTS idx_executive_meeting_attendees_meeting_id;

-- Expense indexes
DROP INDEX IF EXISTS idx_expenses_account_id;
DROP INDEX IF EXISTS idx_expenses_branch_id;
DROP INDEX IF EXISTS idx_expenses_production_order_id;

-- Invoice indexes
DROP INDEX IF EXISTS idx_invoice_line_items_inventory_id;
DROP INDEX IF EXISTS idx_invoices_branch_id;
DROP INDEX IF EXISTS idx_invoices_project_id;

-- Accounting AI indexes
DROP INDEX IF EXISTS idx_accounting_ai_feedback_message_id;
DROP INDEX IF EXISTS idx_accounting_kb_change_history_document_id;

-- Activity log indexes
DROP INDEX IF EXISTS idx_activity_log_user_id;

-- Customer indexes
DROP INDEX IF EXISTS idx_customers_branch_id;

-- Marketplace indexes
DROP INDEX IF EXISTS idx_marketplace_order_items_order_id;
DROP INDEX IF EXISTS idx_marketplace_orders_account_id;
DROP INDEX IF EXISTS idx_marketplace_products_account_id;
DROP INDEX IF EXISTS idx_marketplace_sync_logs_account_id;

-- Order indexes
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_orders_branch_id;
DROP INDEX IF EXISTS idx_orders_project_id;

-- Payment indexes
DROP INDEX IF EXISTS idx_payment_transactions_user_id;

-- Plan indexes
DROP INDEX IF EXISTS idx_plan_discounts_plan_id;

-- Production indexes
DROP INDEX IF EXISTS idx_production_bom_items_product_id;
DROP INDEX IF EXISTS idx_production_bom_items_production_order_id;
DROP INDEX IF EXISTS idx_production_labor_production_order_id;
DROP INDEX IF EXISTS idx_production_labor_entries_production_order_id;
DROP INDEX IF EXISTS idx_production_orders_branch_id;
DROP INDEX IF EXISTS idx_production_orders_product_id;
DROP INDEX IF EXISTS idx_production_orders_project_id;
DROP INDEX IF EXISTS idx_production_quality_checks_production_order_id;

-- Product indexes
DROP INDEX IF EXISTS idx_products_branch_id;

-- Project cost indexes
DROP INDEX IF EXISTS idx_project_cost_entries_project_id;

-- Purchase indexes
DROP INDEX IF EXISTS idx_purchase_invoices_supplier_id;
DROP INDEX IF EXISTS idx_purchase_orders_approved_by;
DROP INDEX IF EXISTS idx_purchase_orders_created_by;
DROP INDEX IF EXISTS idx_purchase_orders_received_by;
DROP INDEX IF EXISTS idx_purchase_requisitions_converted_to_po_id;

-- Stock movement indexes
DROP INDEX IF EXISTS idx_stock_movements_branch_id;
DROP INDEX IF EXISTS idx_stock_movements_production_order_id;
DROP INDEX IF EXISTS idx_stock_movements_project_id;
DROP INDEX IF EXISTS idx_stock_movements_warehouse_id;

-- Supplier indexes
DROP INDEX IF EXISTS idx_supplier_price_history_purchase_order_id;
DROP INDEX IF EXISTS idx_suppliers_created_by;

-- Support indexes
DROP INDEX IF EXISTS idx_support_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_support_messages_sender_id;

-- Transaction indexes
DROP INDEX IF EXISTS idx_transactions_account_id;
DROP INDEX IF EXISTS idx_transactions_customer_id;

-- Trend indexes
DROP INDEX IF EXISTS idx_trend_results_search_id;

-- Warehouse indexes
DROP INDEX IF EXISTS idx_warehouse_stock_product_id;
DROP INDEX IF EXISTS idx_warehouse_transfers_from_warehouse_id;
DROP INDEX IF EXISTS idx_warehouse_transfers_product_id;
DROP INDEX IF EXISTS idx_warehouse_transfers_to_warehouse_id;
DROP INDEX IF EXISTS idx_warehouses_branch_id;
