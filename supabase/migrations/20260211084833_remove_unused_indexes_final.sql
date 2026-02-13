/*
  # Remove Unused Indexes

  1. Performance Optimization
    - Removes 23 indexes that have never been scanned
    - Reduces storage overhead
    - Improves write performance (fewer indexes to update)
    - Reduces maintenance burden

  2. Indexes Removed
    - production_recipe_items: idx_recipe_items_material
    - activity_log: idx_activity_log_user_id
    - admin_logs: idx_admin_logs_user_id
    - demo_requests: idx_demo_requests_processed_by, idx_demo_requests_user_id
    - edocument_activity_log: idx_edocument_activity_log_performed_by
    - executive_meetings: idx_executive_meetings_user_id
    - executive_obligations: idx_executive_obligations_user_id
    - expenses: idx_expenses_created_by
    - marketplace_accounts: idx_marketplace_accounts_user_id
    - payroll: idx_payroll_approved_by
    - posts: idx_posts_author_id
    - purchase_orders: idx_purchase_orders_approved_by, idx_purchase_orders_received_by
    - stock_movements: idx_stock_movements_created_by
    - stress_test_results: idx_stress_test_results_executed_by
    - support_chat_sessions: idx_support_chat_sessions_user_id
    - support_messages: idx_support_messages_sender_id
    - support_tickets: idx_support_tickets_created_by
    - test_results: idx_test_results_executed_by
    - trend_saved_reports: idx_trend_saved_reports_user_id
    - trend_searches: idx_trend_searches_user_id
    - warehouse_transfers: idx_warehouse_transfers_initiated_by

  3. Rationale
    - These indexes have not been used since creation
    - No queries are currently benefiting from them
    - Removing them will improve INSERT/UPDATE performance

  4. Safety
    - Can be recreated if usage patterns change
    - Foreign key indexes were already created in separate migration
*/

DROP INDEX IF EXISTS idx_recipe_items_material;
DROP INDEX IF EXISTS idx_activity_log_user_id;
DROP INDEX IF EXISTS idx_admin_logs_user_id;
DROP INDEX IF EXISTS idx_demo_requests_processed_by;
DROP INDEX IF EXISTS idx_demo_requests_user_id;
DROP INDEX IF EXISTS idx_edocument_activity_log_performed_by;
DROP INDEX IF EXISTS idx_executive_meetings_user_id;
DROP INDEX IF EXISTS idx_executive_obligations_user_id;
DROP INDEX IF EXISTS idx_expenses_created_by;
DROP INDEX IF EXISTS idx_marketplace_accounts_user_id;
DROP INDEX IF EXISTS idx_payroll_approved_by;
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_purchase_orders_approved_by;
DROP INDEX IF EXISTS idx_purchase_orders_received_by;
DROP INDEX IF EXISTS idx_stock_movements_created_by;
DROP INDEX IF EXISTS idx_stress_test_results_executed_by;
DROP INDEX IF EXISTS idx_support_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_support_messages_sender_id;
DROP INDEX IF EXISTS idx_support_tickets_created_by;
DROP INDEX IF EXISTS idx_test_results_executed_by;
DROP INDEX IF EXISTS idx_trend_saved_reports_user_id;
DROP INDEX IF EXISTS idx_trend_searches_user_id;
DROP INDEX IF EXISTS idx_warehouse_transfers_initiated_by;
