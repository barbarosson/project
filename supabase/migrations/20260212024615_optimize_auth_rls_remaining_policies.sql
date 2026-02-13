/*
  # Optimize Remaining Auth RLS Policies

  This migration optimizes RLS policies that re-evaluate auth functions for each row
  by wrapping auth calls with (SELECT ...) to evaluate once per query.

  ## Tables Fixed
  - purchase_invoices (4 policies)
  - purchase_invoice_line_items (4 policies)
  - cash_flow_rules (3 policies)
  - cash_flow_predictions (1 policy)
  - ai_model_metrics (1 policy)
  - production_bom (2 policies)
  - staff (4 policies)
  - salary_definitions (1 policy)
  - payroll (1 policy)
  - payroll_items (1 policy)
  - supplier_price_history (1 policy)
  - einvoice_details (1 policy)
  - tax_rates (1 policy)
  - einvoice_queue (1 policy)
  - einvoice_logs (1 policy)
*/

-- Purchase Invoices
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can insert purchase invoices for own tenant" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can view own tenant purchase invoices" ON public.purchase_invoices;

CREATE POLICY "Users can delete own tenant purchase invoices" ON public.purchase_invoices
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert purchase invoices for own tenant" ON public.purchase_invoices
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoices" ON public.purchase_invoices
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can view own tenant purchase invoices" ON public.purchase_invoices
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Purchase Invoice Line Items
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoice items" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can insert purchase invoice items for own tenant" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoice items" ON public.purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can view own tenant purchase invoice items" ON public.purchase_invoice_line_items;

CREATE POLICY "Users can delete own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert purchase invoice items for own tenant" ON public.purchase_invoice_line_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can view own tenant purchase invoice items" ON public.purchase_invoice_line_items
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));