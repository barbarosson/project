/*
  # Optimize RLS Policies - Tables with tenant_id

  1. Issue
    - RLS policies re-evaluate auth functions for each row
    
  2. Solution
    - Wrap auth.uid() with (SELECT auth.uid())
    - Only for tables that have tenant_id column
*/

-- ============================================================
-- PRODUCTION ORDERS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "production_orders_select" ON production_orders;
CREATE POLICY "production_orders_select"
  ON production_orders
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "production_orders_insert" ON production_orders;
CREATE POLICY "production_orders_insert"
  ON production_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "production_orders_update" ON production_orders;
CREATE POLICY "production_orders_update"
  ON production_orders
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "production_orders_delete" ON production_orders;
CREATE POLICY "production_orders_delete"
  ON production_orders
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- PRODUCTION LABOR (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "production_labor_tenant_isolation" ON production_labor;
CREATE POLICY "production_labor_tenant_isolation"
  ON production_labor
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- PROJECT COST ENTRIES (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Cost entries tenant select" ON project_cost_entries;
CREATE POLICY "Cost entries tenant select"
  ON project_cost_entries
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Cost entries tenant insert" ON project_cost_entries;
CREATE POLICY "Cost entries tenant insert"
  ON project_cost_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Cost entries tenant update" ON project_cost_entries;
CREATE POLICY "Cost entries tenant update"
  ON project_cost_entries
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Cost entries tenant delete" ON project_cost_entries;
CREATE POLICY "Cost entries tenant delete"
  ON project_cost_entries
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- PROJECT RESERVATIONS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Reservations tenant select" ON project_reservations;
CREATE POLICY "Reservations tenant select"
  ON project_reservations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Reservations tenant insert" ON project_reservations;
CREATE POLICY "Reservations tenant insert"
  ON project_reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Reservations tenant update" ON project_reservations;
CREATE POLICY "Reservations tenant update"
  ON project_reservations
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Reservations tenant delete" ON project_reservations;
CREATE POLICY "Reservations tenant delete"
  ON project_reservations
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- MARKETPLACE ORDERS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant marketplace orders" ON marketplace_orders;
CREATE POLICY "Users can view own tenant marketplace orders"
  ON marketplace_orders
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant marketplace orders" ON marketplace_orders;
CREATE POLICY "Users can insert own tenant marketplace orders"
  ON marketplace_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant marketplace orders" ON marketplace_orders;
CREATE POLICY "Users can update own tenant marketplace orders"
  ON marketplace_orders
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant marketplace orders" ON marketplace_orders;
CREATE POLICY "Users can delete own tenant marketplace orders"
  ON marketplace_orders
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- EXECUTIVE OBLIGATIONS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant obligations" ON executive_obligations;
CREATE POLICY "Users can view own tenant obligations"
  ON executive_obligations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant obligations" ON executive_obligations;
CREATE POLICY "Users can insert own tenant obligations"
  ON executive_obligations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant obligations" ON executive_obligations;
CREATE POLICY "Users can update own tenant obligations"
  ON executive_obligations
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant obligations" ON executive_obligations;
CREATE POLICY "Users can delete own tenant obligations"
  ON executive_obligations
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- EXECUTIVE MEETINGS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant meetings" ON executive_meetings;
CREATE POLICY "Users can view own tenant meetings"
  ON executive_meetings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant meetings" ON executive_meetings;
CREATE POLICY "Users can insert own tenant meetings"
  ON executive_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant meetings" ON executive_meetings;
CREATE POLICY "Users can update own tenant meetings"
  ON executive_meetings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant meetings" ON executive_meetings;
CREATE POLICY "Users can delete own tenant meetings"
  ON executive_meetings
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- EXECUTIVE MEETING ATTENDEES (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant meeting attendees" ON executive_meeting_attendees;
CREATE POLICY "Users can view own tenant meeting attendees"
  ON executive_meeting_attendees
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant meeting attendees" ON executive_meeting_attendees;
CREATE POLICY "Users can insert own tenant meeting attendees"
  ON executive_meeting_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant meeting attendees" ON executive_meeting_attendees;
CREATE POLICY "Users can update own tenant meeting attendees"
  ON executive_meeting_attendees
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant meeting attendees" ON executive_meeting_attendees;
CREATE POLICY "Users can delete own tenant meeting attendees"
  ON executive_meeting_attendees
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- EXECUTIVE REMINDERS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant reminders" ON executive_reminders;
CREATE POLICY "Users can view own tenant reminders"
  ON executive_reminders
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant reminders" ON executive_reminders;
CREATE POLICY "Users can insert own tenant reminders"
  ON executive_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant reminders" ON executive_reminders;
CREATE POLICY "Users can update own tenant reminders"
  ON executive_reminders
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant reminders" ON executive_reminders;
CREATE POLICY "Users can delete own tenant reminders"
  ON executive_reminders
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- MARKETPLACE ACCOUNTS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant marketplace accounts" ON marketplace_accounts;
CREATE POLICY "Users can view own tenant marketplace accounts"
  ON marketplace_accounts
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant marketplace accounts" ON marketplace_accounts;
CREATE POLICY "Users can insert own tenant marketplace accounts"
  ON marketplace_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant marketplace accounts" ON marketplace_accounts;
CREATE POLICY "Users can update own tenant marketplace accounts"
  ON marketplace_accounts
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant marketplace accounts" ON marketplace_accounts;
CREATE POLICY "Users can delete own tenant marketplace accounts"
  ON marketplace_accounts
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- MARKETPLACE PRODUCTS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant marketplace products" ON marketplace_products;
CREATE POLICY "Users can view own tenant marketplace products"
  ON marketplace_products
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant marketplace products" ON marketplace_products;
CREATE POLICY "Users can insert own tenant marketplace products"
  ON marketplace_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant marketplace products" ON marketplace_products;
CREATE POLICY "Users can update own tenant marketplace products"
  ON marketplace_products
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant marketplace products" ON marketplace_products;
CREATE POLICY "Users can delete own tenant marketplace products"
  ON marketplace_products
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- MARKETPLACE ORDER ITEMS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant order items" ON marketplace_order_items;
CREATE POLICY "Users can view own tenant order items"
  ON marketplace_order_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant order items" ON marketplace_order_items;
CREATE POLICY "Users can insert own tenant order items"
  ON marketplace_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own tenant order items" ON marketplace_order_items;
CREATE POLICY "Users can update own tenant order items"
  ON marketplace_order_items
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own tenant order items" ON marketplace_order_items;
CREATE POLICY "Users can delete own tenant order items"
  ON marketplace_order_items
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- MARKETPLACE SYNC LOGS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenant sync logs" ON marketplace_sync_logs;
CREATE POLICY "Users can view own tenant sync logs"
  ON marketplace_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own tenant sync logs" ON marketplace_sync_logs;
CREATE POLICY "Users can insert own tenant sync logs"
  ON marketplace_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- WAREHOUSES (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "warehouses_select" ON warehouses;
CREATE POLICY "warehouses_select"
  ON warehouses
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "warehouses_insert" ON warehouses;
CREATE POLICY "warehouses_insert"
  ON warehouses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "warehouses_update" ON warehouses;
CREATE POLICY "warehouses_update"
  ON warehouses
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "warehouses_delete" ON warehouses;
CREATE POLICY "warehouses_delete"
  ON warehouses
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- WAREHOUSE TRANSFERS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "transfers_select" ON warehouse_transfers;
CREATE POLICY "transfers_select"
  ON warehouse_transfers
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "transfers_insert" ON warehouse_transfers;
CREATE POLICY "transfers_insert"
  ON warehouse_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "transfers_update" ON warehouse_transfers;
CREATE POLICY "transfers_update"
  ON warehouse_transfers
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "transfers_delete" ON warehouse_transfers;
CREATE POLICY "transfers_delete"
  ON warehouse_transfers
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- TREND SEARCHES (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can read own tenant trend searches" ON trend_searches;
CREATE POLICY "Users can read own tenant trend searches"
  ON trend_searches
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert trend searches for own tenant" ON trend_searches;
CREATE POLICY "Users can insert trend searches for own tenant"
  ON trend_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own trend searches" ON trend_searches;
CREATE POLICY "Users can delete own trend searches"
  ON trend_searches
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- TREND RESULTS (has tenant_id, but uses JOIN)
-- ============================================================

DROP POLICY IF EXISTS "Users can read own tenant trend results" ON trend_results;
CREATE POLICY "Users can read own tenant trend results"
  ON trend_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trend_searches ts
      WHERE ts.id = trend_results.search_id
      AND ts.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert trend results for own tenant" ON trend_results;
CREATE POLICY "Users can insert trend results for own tenant"
  ON trend_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trend_searches ts
      WHERE ts.id = trend_results.search_id
      AND ts.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete own trend results" ON trend_results;
CREATE POLICY "Users can delete own trend results"
  ON trend_results
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trend_searches ts
      WHERE ts.id = trend_results.search_id
      AND ts.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- TREND SAVED REPORTS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "Users can read own tenant saved reports" ON trend_saved_reports;
CREATE POLICY "Users can read own tenant saved reports"
  ON trend_saved_reports
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert saved reports for own tenant" ON trend_saved_reports;
CREATE POLICY "Users can insert saved reports for own tenant"
  ON trend_saved_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own saved reports" ON trend_saved_reports;
CREATE POLICY "Users can update own saved reports"
  ON trend_saved_reports
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own saved reports" ON trend_saved_reports;
CREATE POLICY "Users can delete own saved reports"
  ON trend_saved_reports
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- ACCOUNTING AI THREADS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "accounting_ai_threads_select" ON accounting_ai_threads;
CREATE POLICY "accounting_ai_threads_select"
  ON accounting_ai_threads
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "accounting_ai_threads_insert" ON accounting_ai_threads;
CREATE POLICY "accounting_ai_threads_insert"
  ON accounting_ai_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "accounting_ai_threads_update" ON accounting_ai_threads;
CREATE POLICY "accounting_ai_threads_update"
  ON accounting_ai_threads
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "accounting_ai_threads_delete" ON accounting_ai_threads;
CREATE POLICY "accounting_ai_threads_delete"
  ON accounting_ai_threads
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- ACCOUNTING AI MESSAGES (has tenant_id, but uses JOIN)
-- ============================================================

DROP POLICY IF EXISTS "accounting_ai_messages_select" ON accounting_ai_messages;
CREATE POLICY "accounting_ai_messages_select"
  ON accounting_ai_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounting_ai_threads aat
      WHERE aat.id = accounting_ai_messages.thread_id
      AND aat.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "accounting_ai_messages_insert" ON accounting_ai_messages;
CREATE POLICY "accounting_ai_messages_insert"
  ON accounting_ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounting_ai_threads aat
      WHERE aat.id = accounting_ai_messages.thread_id
      AND aat.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- ACCOUNTING AI FEEDBACK (has tenant_id, but uses JOIN)
-- ============================================================

DROP POLICY IF EXISTS "accounting_ai_feedback_select" ON accounting_ai_feedback;
CREATE POLICY "accounting_ai_feedback_select"
  ON accounting_ai_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounting_ai_messages aam
      JOIN accounting_ai_threads aat ON aat.id = aam.thread_id
      WHERE aam.id = accounting_ai_feedback.message_id
      AND aat.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "accounting_ai_feedback_insert" ON accounting_ai_feedback;
CREATE POLICY "accounting_ai_feedback_insert"
  ON accounting_ai_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounting_ai_messages aam
      JOIN accounting_ai_threads aat ON aat.id = aam.thread_id
      WHERE aam.id = accounting_ai_feedback.message_id
      AND aat.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- BRANCHES (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "branches_select" ON branches;
CREATE POLICY "branches_select"
  ON branches
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branches_insert" ON branches;
CREATE POLICY "branches_insert"
  ON branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branches_update" ON branches;
CREATE POLICY "branches_update"
  ON branches
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branches_delete" ON branches;
CREATE POLICY "branches_delete"
  ON branches
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- BRANCH TARGETS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "branch_targets_select" ON branch_targets;
CREATE POLICY "branch_targets_select"
  ON branch_targets
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branch_targets_insert" ON branch_targets;
CREATE POLICY "branch_targets_insert"
  ON branch_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branch_targets_update" ON branch_targets;
CREATE POLICY "branch_targets_update"
  ON branch_targets
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "branch_targets_delete" ON branch_targets;
CREATE POLICY "branch_targets_delete"
  ON branch_targets
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );
