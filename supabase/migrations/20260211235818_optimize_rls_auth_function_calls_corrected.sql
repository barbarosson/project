/*
  # Optimize RLS Policies - Auth Function Calls (Corrected)

  This migration optimizes RLS policies by wrapping auth function calls with (select ...)
  to prevent re-evaluation for each row, significantly improving query performance.

  ## Changes
  - Optimize auth.uid() and auth.jwt() calls in RLS policies
  - Handle both text and uuid tenant_id types correctly
*/

-- Credit Balances (user_id is uuid)
DROP POLICY IF EXISTS "Users can view own credit balance" ON public.credit_balances;
DROP POLICY IF EXISTS "Users can insert own credit balance" ON public.credit_balances;
DROP POLICY IF EXISTS "Users can update own credit balance" ON public.credit_balances;

CREATE POLICY "Users can view own credit balance" ON public.credit_balances
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own credit balance" ON public.credit_balances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own credit balance" ON public.credit_balances
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Purchase Invoices (tenant_id is uuid)
DROP POLICY IF EXISTS "Users can view own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can insert purchase invoices for own tenant" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoices" ON public.purchase_invoices;

CREATE POLICY "Users can view own tenant purchase invoices" ON public.purchase_invoices
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert purchase invoices for own tenant" ON public.purchase_invoices
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoices" ON public.purchase_invoices
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant purchase invoices" ON public.purchase_invoices
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Purchase Invoice Line Items (tenant_id is uuid)
DROP POLICY IF EXISTS "Users can view own tenant purchase invoice items" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can insert purchase invoice items for own tenant" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoice items" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoice items" ON public.purchase_invoice_line_items;

CREATE POLICY "Users can view own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert purchase invoice items for own tenant" ON public.purchase_invoice_line_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Cash Flow Rules (tenant_id is uuid)
DROP POLICY IF EXISTS "Users can view own tenant cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can insert cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can update own tenant cash flow rules" ON public.cash_flow_rules;

CREATE POLICY "Users can view own tenant cash flow rules" ON public.cash_flow_rules
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert cash flow rules" ON public.cash_flow_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant cash flow rules" ON public.cash_flow_rules
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Cash Flow Predictions (tenant_id is uuid - assuming based on pattern)
DROP POLICY IF EXISTS "Users can view own tenant predictions" ON public.cash_flow_predictions;

CREATE POLICY "Users can view own tenant predictions" ON public.cash_flow_predictions
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- AI Model Metrics (tenant_id is uuid - assuming based on pattern)
DROP POLICY IF EXISTS "Users can view own tenant model metrics" ON public.ai_model_metrics;

CREATE POLICY "Users can view own tenant model metrics" ON public.ai_model_metrics
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Turkish Provinces (no tenant_id)
DROP POLICY IF EXISTS "Authenticated users can view turkish provinces" ON public.turkish_provinces;

CREATE POLICY "Authenticated users can view turkish provinces" ON public.turkish_provinces
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Production BOM (tenant_id is uuid - assuming based on pattern)
DROP POLICY IF EXISTS "Users can view own tenant BOM" ON public.production_bom;
DROP POLICY IF EXISTS "Users can manage own tenant BOM" ON public.production_bom;

CREATE POLICY "Users can view own tenant BOM" ON public.production_bom
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can manage own tenant BOM" ON public.production_bom
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Staff (tenant_id is text)
DROP POLICY IF EXISTS "Users can view own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can insert own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can update own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can delete own tenant staff" ON public.staff;

CREATE POLICY "Users can view own tenant staff" ON public.staff
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can insert own tenant staff" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can update own tenant staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can delete own tenant staff" ON public.staff
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Salary Definitions (tenant_id is text)
DROP POLICY IF EXISTS "Users can view own tenant salary_definitions" ON public.salary_definitions;
DROP POLICY IF EXISTS "Users can insert own tenant salary_definitions" ON public.salary_definitions;
DROP POLICY IF EXISTS "Users can update own tenant salary_definitions" ON public.salary_definitions;
DROP POLICY IF EXISTS "Users can delete own tenant salary_definitions" ON public.salary_definitions;
DROP POLICY IF EXISTS "Users can manage salary definitions" ON public.salary_definitions;

CREATE POLICY "Users can manage salary definitions" ON public.salary_definitions
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Payroll (tenant_id is text)
DROP POLICY IF EXISTS "Users can view own tenant payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can insert own tenant payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can update own tenant payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can delete own tenant payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;

CREATE POLICY "Users can manage payroll" ON public.payroll
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Payroll Items (tenant_id is text)
DROP POLICY IF EXISTS "Users can view own tenant payroll_items" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can insert own tenant payroll_items" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can update own tenant payroll_items" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can delete own tenant payroll_items" ON public.payroll_items;
DROP POLICY IF EXISTS "Users can manage payroll items" ON public.payroll_items;

CREATE POLICY "Users can manage payroll items" ON public.payroll_items
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));