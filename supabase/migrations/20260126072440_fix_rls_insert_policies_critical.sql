/*
  # CRITICAL FIX: RLS INSERT Policy Violations
  
  ## Problem
  - Getting 42501 Row-Level Security policy violation errors on INSERT
  - Current "FOR ALL" policies may not be working correctly for INSERT
  - Need explicit INSERT policies with proper WITH CHECK clauses
  
  ## Solution
  - Drop all existing "Authenticated" FOR ALL policies
  - Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
  - Use (SELECT auth.uid()) pattern for better performance
  - Explicit WITH CHECK for INSERT operations
  
  ## Tables Fixed
  - customers, products, invoices, invoice_line_items
  - transactions, accounts, expenses
  - proposals, campaigns, support_tickets
  - All other core tables
*/

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated read customers" ON customers;
DROP POLICY IF EXISTS "Authenticated insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated delete customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own tenant customers" ON customers;

CREATE POLICY "Users can select own tenant customers"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant customers"
  ON customers FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated read products" ON products;
DROP POLICY IF EXISTS "Authenticated insert products" ON products;
DROP POLICY IF EXISTS "Authenticated update products" ON products;
DROP POLICY IF EXISTS "Authenticated delete products" ON products;

CREATE POLICY "Users can select own tenant products"
  ON products FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant products"
  ON products FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant products"
  ON products FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- INVOICES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated read invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated insert invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated update invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated delete invoices" ON invoices;

CREATE POLICY "Users can select own tenant invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- INVOICE_LINE_ITEMS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage line_items" ON invoice_line_items;

CREATE POLICY "Users can select own tenant invoice_line_items"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant invoice_line_items"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant invoice_line_items"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant invoice_line_items"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage transactions" ON transactions;

CREATE POLICY "Users can select own tenant transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage accounts" ON accounts;

CREATE POLICY "Users can select own tenant accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- EXPENSES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage expenses" ON expenses;

CREATE POLICY "Users can select own tenant expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- PROPOSALS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage proposals" ON proposals;

CREATE POLICY "Users can select own tenant proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage campaigns" ON campaigns;

CREATE POLICY "Users can select own tenant campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- SUPPORT_TICKETS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage support_tickets" ON support_tickets;

CREATE POLICY "Users can select own tenant support_tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant support_tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant support_tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant support_tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- INVENTORY TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage inventory" ON inventory;

CREATE POLICY "Users can select own tenant inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- STOCK_MOVEMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage stock_movements" ON stock_movements;

CREATE POLICY "Users can select own tenant stock_movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant stock_movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant stock_movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant stock_movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage notifications" ON notifications;

CREATE POLICY "Users can select own tenant notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- COMPANY_SETTINGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage company_settings" ON company_settings;

CREATE POLICY "Users can select own tenant company_settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant company_settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant company_settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant company_settings"
  ON company_settings FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- AI_CHAT_THREADS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage ai_chat_threads" ON ai_chat_threads;

CREATE POLICY "Users can select own tenant ai_chat_threads"
  ON ai_chat_threads FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant ai_chat_threads"
  ON ai_chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant ai_chat_threads"
  ON ai_chat_threads FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant ai_chat_threads"
  ON ai_chat_threads FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- AI_CHAT_HISTORY TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage ai_chat_history" ON ai_chat_history;

CREATE POLICY "Users can select own tenant ai_chat_history"
  ON ai_chat_history FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant ai_chat_history"
  ON ai_chat_history FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant ai_chat_history"
  ON ai_chat_history FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant ai_chat_history"
  ON ai_chat_history FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- CUSTOMER_SEGMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage customer_segments" ON customer_segments;

CREATE POLICY "Users can select own tenant customer_segments"
  ON customer_segments FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant customer_segments"
  ON customer_segments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant customer_segments"
  ON customer_segments FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant customer_segments"
  ON customer_segments FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- PROPOSAL_LINE_ITEMS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage proposal_line_items" ON proposal_line_items;

CREATE POLICY "Users can select own tenant proposal_line_items"
  ON proposal_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant proposal_line_items"
  ON proposal_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant proposal_line_items"
  ON proposal_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant proposal_line_items"
  ON proposal_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- PURCHASE_INVOICES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage purchase_invoices" ON purchase_invoices;

CREATE POLICY "Users can select own tenant purchase_invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant purchase_invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant purchase_invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant purchase_invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- PURCHASE_INVOICE_LINE_ITEMS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage purchase_invoice_line_items" ON purchase_invoice_line_items;

CREATE POLICY "Users can select own tenant purchase_invoice_line_items"
  ON purchase_invoice_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant purchase_invoice_line_items"
  ON purchase_invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant purchase_invoice_line_items"
  ON purchase_invoice_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant purchase_invoice_line_items"
  ON purchase_invoice_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =====================================================
-- SIMPLE_TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Authenticated manage simple_transactions" ON simple_transactions;

CREATE POLICY "Users can select own tenant simple_transactions"
  ON simple_transactions FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant simple_transactions"
  ON simple_transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant simple_transactions"
  ON simple_transactions FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant simple_transactions"
  ON simple_transactions FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()));
