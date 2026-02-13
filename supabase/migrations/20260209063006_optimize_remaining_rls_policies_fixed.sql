/*
  # Optimize Remaining RLS Policies - Fixed

  1. Issue
    - Additional RLS policies still re-evaluating auth functions
    
  2. Solution
    - Wrap is_super_admin() with (SELECT is_super_admin())
    - Wrap auth.uid() with (SELECT auth.uid())
*/

-- ============================================================
-- FINANCE ROBOT THREADS
-- ============================================================

DROP POLICY IF EXISTS "Users can select own finance robot threads" ON finance_robot_threads;
CREATE POLICY "Users can select own finance robot threads"
  ON finance_robot_threads
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert own finance robot threads" ON finance_robot_threads;
CREATE POLICY "Users can insert own finance robot threads"
  ON finance_robot_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own finance robot threads" ON finance_robot_threads;
CREATE POLICY "Users can update own finance robot threads"
  ON finance_robot_threads
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own finance robot threads" ON finance_robot_threads;
CREATE POLICY "Users can delete own finance robot threads"
  ON finance_robot_threads
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================
-- FINANCE ROBOT MESSAGES
-- ============================================================

DROP POLICY IF EXISTS "Users can select own finance robot messages" ON finance_robot_messages;
CREATE POLICY "Users can select own finance robot messages"
  ON finance_robot_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM finance_robot_threads frt
      WHERE frt.id = finance_robot_messages.thread_id
      AND frt.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert own finance robot messages" ON finance_robot_messages;
CREATE POLICY "Users can insert own finance robot messages"
  ON finance_robot_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM finance_robot_threads frt
      WHERE frt.id = finance_robot_messages.thread_id
      AND frt.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete own finance robot messages" ON finance_robot_messages;
CREATE POLICY "Users can delete own finance robot messages"
  ON finance_robot_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM finance_robot_threads frt
      WHERE frt.id = finance_robot_messages.thread_id
      AND frt.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can read own payment transactions" ON payment_transactions;
CREATE POLICY "Users can read own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Super admins can read all payment transactions" ON payment_transactions;
CREATE POLICY "Super admins can read all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Service role can insert payment transactions" ON payment_transactions;
CREATE POLICY "Service role can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can update payment transactions" ON payment_transactions;
CREATE POLICY "Super admins can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- PLAN FEATURE VALUES
-- ============================================================

DROP POLICY IF EXISTS "Super admins can insert plan feature values" ON plan_feature_values;
CREATE POLICY "Super admins can insert plan feature values"
  ON plan_feature_values
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can update plan feature values" ON plan_feature_values;
CREATE POLICY "Super admins can update plan feature values"
  ON plan_feature_values
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can delete plan feature values" ON plan_feature_values;
CREATE POLICY "Super admins can delete plan feature values"
  ON plan_feature_values
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- PLAN INSTALLMENT OPTIONS
-- ============================================================

DROP POLICY IF EXISTS "Super admins can insert installment options" ON plan_installment_options;
CREATE POLICY "Super admins can insert installment options"
  ON plan_installment_options
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can update installment options" ON plan_installment_options;
CREATE POLICY "Super admins can update installment options"
  ON plan_installment_options
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can delete installment options" ON plan_installment_options;
CREATE POLICY "Super admins can delete installment options"
  ON plan_installment_options
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- PLAN DISCOUNTS
-- ============================================================

DROP POLICY IF EXISTS "Super admins can insert plan discounts" ON plan_discounts;
CREATE POLICY "Super admins can insert plan discounts"
  ON plan_discounts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can update plan discounts" ON plan_discounts;
CREATE POLICY "Super admins can update plan discounts"
  ON plan_discounts
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can delete plan discounts" ON plan_discounts;
CREATE POLICY "Super admins can delete plan discounts"
  ON plan_discounts
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- PLAN FEATURE ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Auth users can read feature assignments" ON plan_feature_assignments;
CREATE POLICY "Auth users can read feature assignments"
  ON plan_feature_assignments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins can insert feature assignments" ON plan_feature_assignments;
CREATE POLICY "Super admins can insert feature assignments"
  ON plan_feature_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can update feature assignments" ON plan_feature_assignments;
CREATE POLICY "Super admins can update feature assignments"
  ON plan_feature_assignments
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "Super admins can delete feature assignments" ON plan_feature_assignments;
CREATE POLICY "Super admins can delete feature assignments"
  ON plan_feature_assignments
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- ACCOUNTING KB DOCUMENTS (has tenant_id)
-- ============================================================

DROP POLICY IF EXISTS "accounting_kb_documents_select" ON accounting_kb_documents;
CREATE POLICY "accounting_kb_documents_select"
  ON accounting_kb_documents
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    OR (SELECT is_super_admin()) = true
  );

DROP POLICY IF EXISTS "accounting_kb_documents_insert" ON accounting_kb_documents;
CREATE POLICY "accounting_kb_documents_insert"
  ON accounting_kb_documents
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

DROP POLICY IF EXISTS "accounting_kb_documents_update" ON accounting_kb_documents;
CREATE POLICY "accounting_kb_documents_update"
  ON accounting_kb_documents
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()) = true);

-- ============================================================
-- ACCOUNTING KB CATEGORIES
-- ============================================================

DROP POLICY IF EXISTS "accounting_kb_categories_insert" ON accounting_kb_categories;
CREATE POLICY "accounting_kb_categories_insert"
  ON accounting_kb_categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

-- ============================================================
-- ACCOUNTING KB DOC CATEGORIES
-- ============================================================

DROP POLICY IF EXISTS "accounting_kb_doc_categories_insert" ON accounting_kb_doc_categories;
CREATE POLICY "accounting_kb_doc_categories_insert"
  ON accounting_kb_doc_categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

-- ============================================================
-- ACCOUNTING KB CHANGE HISTORY
-- ============================================================

DROP POLICY IF EXISTS "accounting_kb_change_history_insert" ON accounting_kb_change_history;
CREATE POLICY "accounting_kb_change_history_insert"
  ON accounting_kb_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

-- ============================================================
-- ACCOUNTING AI QUALITY METRICS
-- ============================================================

DROP POLICY IF EXISTS "accounting_ai_quality_metrics_insert" ON accounting_ai_quality_metrics;
CREATE POLICY "accounting_ai_quality_metrics_insert"
  ON accounting_ai_quality_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()) = true);

-- ============================================================
-- CONTENT SECTIONS
-- ============================================================

DROP POLICY IF EXISTS "Super admins can manage content_sections" ON content_sections;
CREATE POLICY "Super admins can manage content_sections"
  ON content_sections
  FOR ALL
  TO authenticated
  USING ((SELECT is_super_admin()) = true);
