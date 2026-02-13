/*
  # Optimize Auth RLS for Cash Flow, AI, and Production Tables

  This migration optimizes RLS policies by ensuring auth functions
  are evaluated once per query using explicit SELECT wrappers.

  ## Tables Fixed
  - cash_flow_rules
  - cash_flow_predictions
  - ai_model_metrics
  - production_bom
*/

-- Cash Flow Rules
DROP POLICY IF EXISTS "Users can insert cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can update own tenant cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can view own tenant cash flow rules" ON public.cash_flow_rules;

CREATE POLICY "Users can insert cash flow rules" ON public.cash_flow_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant cash flow rules" ON public.cash_flow_rules
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can view own tenant cash flow rules" ON public.cash_flow_rules
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Cash Flow Predictions
DROP POLICY IF EXISTS "Users can view own tenant predictions" ON public.cash_flow_predictions;

CREATE POLICY "Users can view own tenant predictions" ON public.cash_flow_predictions
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- AI Model Metrics
DROP POLICY IF EXISTS "Users can view own tenant model metrics" ON public.ai_model_metrics;

CREATE POLICY "Users can view own tenant model metrics" ON public.ai_model_metrics
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Production BOM
DROP POLICY IF EXISTS "Users can manage own tenant BOM" ON public.production_bom;
DROP POLICY IF EXISTS "Users can view own tenant BOM" ON public.production_bom;

CREATE POLICY "Users can manage own tenant BOM" ON public.production_bom
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can view own tenant BOM" ON public.production_bom
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));