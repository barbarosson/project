/*
  # Add Missing Foreign Key Indexes - Comprehensive Fix

  This migration adds all missing foreign key indexes identified by Supabase security scan.
  Foreign key indexes are critical for query performance and CASCADE operations.

  ## Changes
  - Add 47 missing foreign key indexes across multiple tables
*/

-- Accounting AI Feedback
CREATE INDEX IF NOT EXISTS idx_accounting_ai_feedback_message_id ON public.accounting_ai_feedback(message_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON public.customers(branch_id);

-- E-Document Activity Log
CREATE INDEX IF NOT EXISTS idx_edocument_activity_log_edocument_id ON public.edocument_activity_log(edocument_id);

-- E-Document Line Items
CREATE INDEX IF NOT EXISTS idx_edocument_line_items_edocument_id ON public.edocument_line_items(edocument_id);

-- Executive Meeting Attendees
CREATE INDEX IF NOT EXISTS idx_executive_meeting_attendees_meeting_id ON public.executive_meeting_attendees(meeting_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_production_order_id ON public.expenses(production_order_id);

-- Marketplace Order Items
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order_id ON public.marketplace_order_items(order_id);

-- Marketplace Orders
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_account_id ON public.marketplace_orders(account_id);

-- Marketplace Products
CREATE INDEX IF NOT EXISTS idx_marketplace_products_account_id ON public.marketplace_products(account_id);

-- Marketplace Sync Logs
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_account_id ON public.marketplace_sync_logs(account_id);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON public.orders(project_id);

-- Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);

-- Production BOM Items
CREATE INDEX IF NOT EXISTS idx_production_bom_items_product_id ON public.production_bom_items(product_id);
CREATE INDEX IF NOT EXISTS idx_production_bom_items_production_order_id ON public.production_bom_items(production_order_id);

-- Production Labor Entries
CREATE INDEX IF NOT EXISTS idx_production_labor_entries_production_order_id ON public.production_labor_entries(production_order_id);

-- Production Orders
CREATE INDEX IF NOT EXISTS idx_production_orders_branch_id ON public.production_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON public.production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_project_id ON public.production_orders(project_id);

-- Production Quality Checks
CREATE INDEX IF NOT EXISTS idx_production_quality_checks_production_order_id ON public.production_quality_checks(production_order_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON public.products(branch_id);

-- Project Cost Entries
CREATE INDEX IF NOT EXISTS idx_project_cost_entries_project_id ON public.project_cost_entries(project_id);

-- Project Milestones
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);

-- Project Reservations
CREATE INDEX IF NOT EXISTS idx_project_reservations_product_id ON public.project_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_project_reservations_project_id ON public.project_reservations(project_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_by ON public.purchase_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_received_by ON public.purchase_orders(received_by);

-- Purchase Requisitions
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_converted_to_po_id ON public.purchase_requisitions(converted_to_po_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_id ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_production_order_id ON public.stock_movements(production_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_id ON public.stock_movements(warehouse_id);

-- Supplier Price History
CREATE INDEX IF NOT EXISTS idx_supplier_price_history_purchase_order_id ON public.supplier_price_history(purchase_order_id);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON public.suppliers(created_by);

-- Support Chat Sessions
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON public.support_chat_sessions(user_id);

-- Support Messages
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON public.support_messages(sender_id);

-- Trend Results
CREATE INDEX IF NOT EXISTS idx_trend_results_search_id ON public.trend_results(search_id);

-- Warehouse Stock
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product_id ON public.warehouse_stock(product_id);

-- Warehouse Transfers
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_from_warehouse_id ON public.warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_product_id ON public.warehouse_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_to_warehouse_id ON public.warehouse_transfers(to_warehouse_id);

-- Warehouses
CREATE INDEX IF NOT EXISTS idx_warehouses_branch_id ON public.warehouses(branch_id);