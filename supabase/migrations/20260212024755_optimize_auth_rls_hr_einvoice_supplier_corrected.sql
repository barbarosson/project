/*
  # Optimize Auth RLS for HR, eInvoice, and Supplier Tables (Corrected)

  This migration optimizes RLS policies by ensuring auth functions
  are evaluated once per query using explicit SELECT wrappers.
  Handles different tenant_id data types correctly.

  ## Tables Fixed
  - staff (text tenant_id)
  - salary_definitions (text tenant_id)
  - payroll (text tenant_id)
  - payroll_items (text tenant_id)
  - supplier_price_history (uuid tenant_id)
  - einvoice_details (uuid tenant_id)
  - tax_rates (uuid tenant_id)
  - einvoice_queue (via foreign key)
  - einvoice_logs (via foreign key)
*/

-- Staff (text tenant_id)
DROP POLICY IF EXISTS "Users can delete own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can insert own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can update own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can view own tenant staff" ON public.staff;

CREATE POLICY "Users can delete own tenant staff" ON public.staff
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can insert own tenant staff" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can update own tenant staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

CREATE POLICY "Users can view own tenant staff" ON public.staff
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Salary Definitions (text tenant_id)
DROP POLICY IF EXISTS "Users can manage salary definitions" ON public.salary_definitions;

CREATE POLICY "Users can manage salary definitions" ON public.salary_definitions
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Payroll (text tenant_id)
DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;

CREATE POLICY "Users can manage payroll" ON public.payroll
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Payroll Items (text tenant_id)
DROP POLICY IF EXISTS "Users can manage payroll items" ON public.payroll_items;

CREATE POLICY "Users can manage payroll items" ON public.payroll_items
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id'));

-- Supplier Price History (uuid tenant_id)
DROP POLICY IF EXISTS "Users can insert own tenant price history" ON public.supplier_price_history;

CREATE POLICY "Users can insert own tenant price history" ON public.supplier_price_history
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- eInvoice Details (uuid tenant_id)
DROP POLICY IF EXISTS "Users can manage own tenant einvoice details" ON public.einvoice_details;

CREATE POLICY "Users can manage own tenant einvoice details" ON public.einvoice_details
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Tax Rates (uuid tenant_id)
DROP POLICY IF EXISTS "Users can manage own tenant tax rates" ON public.tax_rates;

CREATE POLICY "Users can manage own tenant tax rates" ON public.tax_rates
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- eInvoice Queue (via foreign key to einvoice_details)
DROP POLICY IF EXISTS "Users can manage own tenant einvoice queue" ON public.einvoice_queue;

CREATE POLICY "Users can manage own tenant einvoice queue" ON public.einvoice_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM einvoice_details
      WHERE einvoice_details.id = einvoice_queue.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM einvoice_details
      WHERE einvoice_details.id = einvoice_queue.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  );

-- eInvoice Logs (via foreign key to einvoice_details)
DROP POLICY IF EXISTS "Users can manage own tenant einvoice logs" ON public.einvoice_logs;

CREATE POLICY "Users can manage own tenant einvoice logs" ON public.einvoice_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM einvoice_details
      WHERE einvoice_details.id = einvoice_logs.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM einvoice_details
      WHERE einvoice_details.id = einvoice_logs.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  );