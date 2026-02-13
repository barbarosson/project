/*
  # Add Super Admin Access Policies
  
  1. Overview
    - Adds super admin policies for all tables to allow admin@modulus.com full access
    - Super admin can view, insert, update, and delete records in all tables
    - Super admin can access all tenants' data
  
  2. Security
    - Policies check if user email is 'admin@modulus.com'
    - Uses auth.jwt() to get user email from JWT token
    - Super admin policies are permissive and allow all operations
  
  3. Implementation
    - Creates helper function to check super admin status
    - Adds super admin policies for all main tables
    - Policies are non-restrictive and bypass tenant isolation
*/

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt()->>'email')::text = 'admin@modulus.com',
    false
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- TENANTS TABLE
CREATE POLICY "Super admin full access to tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- CUSTOMERS TABLE
CREATE POLICY "Super admin full access to customers"
  ON customers FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- PRODUCTS TABLE
CREATE POLICY "Super admin full access to products"
  ON products FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- INVENTORY TABLE
CREATE POLICY "Super admin full access to inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- INVOICES TABLE
CREATE POLICY "Super admin full access to invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- INVOICE LINE ITEMS TABLE
CREATE POLICY "Super admin full access to invoice_line_items"
  ON invoice_line_items FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- EXPENSES TABLE
CREATE POLICY "Super admin full access to expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- STOCK MOVEMENTS TABLE
CREATE POLICY "Super admin full access to stock_movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- PROPOSALS TABLE
CREATE POLICY "Super admin full access to proposals"
  ON proposals FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- PROPOSAL LINE ITEMS TABLE
CREATE POLICY "Super admin full access to proposal_line_items"
  ON proposal_line_items FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- CAMPAIGNS TABLE
CREATE POLICY "Super admin full access to campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ACCOUNTS TABLE
CREATE POLICY "Super admin full access to accounts"
  ON accounts FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- TRANSACTIONS TABLE
CREATE POLICY "Super admin full access to transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SIMPLE TRANSACTIONS TABLE
CREATE POLICY "Super admin full access to simple_transactions"
  ON simple_transactions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- AI CHAT THREADS TABLE
CREATE POLICY "Super admin full access to ai_chat_threads"
  ON ai_chat_threads FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- AI CHAT HISTORY TABLE
CREATE POLICY "Super admin full access to ai_chat_history"
  ON ai_chat_history FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- NOTIFICATIONS TABLE
CREATE POLICY "Super admin full access to notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SUPPORT TICKETS TABLE
CREATE POLICY "Super admin full access to support_tickets"
  ON support_tickets FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SUPPORT CHAT SESSIONS TABLE
CREATE POLICY "Super admin full access to support_chat_sessions"
  ON support_chat_sessions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SUPPORT MESSAGES TABLE
CREATE POLICY "Super admin full access to support_messages"
  ON support_messages FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- COMPANY SETTINGS TABLE
CREATE POLICY "Super admin full access to company_settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SUBSCRIPTION PLANS TABLE
CREATE POLICY "Super admin full access to subscription_plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- USER SUBSCRIPTIONS TABLE
CREATE POLICY "Super admin full access to user_subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- CREDIT BALANCES TABLE
CREATE POLICY "Super admin full access to credit_balances"
  ON credit_balances FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- CUSTOMER SEGMENTS TABLE
CREATE POLICY "Super admin full access to customer_segments"
  ON customer_segments FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- PURCHASE INVOICES TABLE
CREATE POLICY "Super admin full access to purchase_invoices"
  ON purchase_invoices FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- PURCHASE INVOICE LINE ITEMS TABLE
CREATE POLICY "Super admin full access to purchase_invoice_line_items"
  ON purchase_invoice_line_items FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
