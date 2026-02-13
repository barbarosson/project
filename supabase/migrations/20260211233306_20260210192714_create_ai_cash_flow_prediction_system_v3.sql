/*
  # AI Cash Flow Prediction System - Enhanced ML Tables

  1. New Tables: cash_flow_rules, cash_flow_predictions, ai_model_metrics, production_bom
  2. Security: RLS enabled, tenant-based access
  3. Features: Multi-scenario predictions, rule-based adjustments, model tracking
*/

CREATE TABLE IF NOT EXISTS public.cash_flow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type IN ('marketplace_delay', 'seasonal_factor', 'payment_term', 'collection_pattern', 'customer_risk')),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  adjustment_factor numeric(5,2) NOT NULL DEFAULT 1.0 CHECK (adjustment_factor > 0 AND adjustment_factor <= 2.0),
  priority int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_rules_tenant ON public.cash_flow_rules(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cash_flow_rules_type ON public.cash_flow_rules(rule_type, priority DESC);
ALTER TABLE public.cash_flow_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can insert cash flow rules" ON public.cash_flow_rules;
DROP POLICY IF EXISTS "Users can update own tenant cash flow rules" ON public.cash_flow_rules;

CREATE POLICY "Users can view own tenant cash flow rules" ON public.cash_flow_rules FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Users can insert cash flow rules" ON public.cash_flow_rules FOR INSERT TO authenticated WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Users can update own tenant cash flow rules" ON public.cash_flow_rules FOR UPDATE TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE TABLE IF NOT EXISTS public.cash_flow_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid,
  prediction_date date NOT NULL,
  predicted_balance numeric(15,2) NOT NULL,
  actual_balance numeric(15,2),
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_color text,
  scenario_type text NOT NULL DEFAULT 'realistic' CHECK (scenario_type IN ('pessimistic', 'realistic', 'optimistic')),
  model_version text NOT NULL,
  factors_used jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  accuracy_score numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, branch_id, prediction_date, scenario_type)
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_predictions_tenant_date ON public.cash_flow_predictions(tenant_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_predictions_branch_date ON public.cash_flow_predictions(branch_id, prediction_date DESC) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_flow_predictions_risk ON public.cash_flow_predictions(tenant_id, risk_level, prediction_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_predictions_scenario ON public.cash_flow_predictions(tenant_id, scenario_type, prediction_date);
ALTER TABLE public.cash_flow_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant predictions" ON public.cash_flow_predictions;
DROP POLICY IF EXISTS "Service role can manage predictions" ON public.cash_flow_predictions;

CREATE POLICY "Users can view own tenant predictions" ON public.cash_flow_predictions FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Service role can manage predictions" ON public.cash_flow_predictions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ai_model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid,
  model_version text NOT NULL,
  accuracy_score numeric(5,2) NOT NULL,
  mae numeric(10,2) NOT NULL,
  rmse numeric(10,2) NOT NULL,
  training_date timestamptz NOT NULL,
  data_points int NOT NULL,
  feature_importance jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_tenant ON public.ai_model_metrics(tenant_id, training_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_branch ON public.ai_model_metrics(branch_id, training_date DESC) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_version ON public.ai_model_metrics(model_version, training_date DESC);
ALTER TABLE public.ai_model_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant model metrics" ON public.ai_model_metrics;
DROP POLICY IF EXISTS "Service role can manage model metrics" ON public.ai_model_metrics;

CREATE POLICY "Users can view own tenant model metrics" ON public.ai_model_metrics FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Service role can manage model metrics" ON public.ai_model_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.production_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  component_product_id uuid NOT NULL,
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'piece',
  cost_per_unit numeric(15,2),
  waste_percentage numeric(5,2) DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage < 100),
  is_critical boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, component_product_id)
);

CREATE INDEX IF NOT EXISTS idx_production_bom_product ON public.production_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_production_bom_component ON public.production_bom(component_product_id);
CREATE INDEX IF NOT EXISTS idx_production_bom_tenant ON public.production_bom(tenant_id);
ALTER TABLE public.production_bom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant BOM" ON public.production_bom;
DROP POLICY IF EXISTS "Users can manage own tenant BOM" ON public.production_bom;

CREATE POLICY "Users can view own tenant BOM" ON public.production_bom FOR SELECT TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "Users can manage own tenant BOM" ON public.production_bom FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE OR REPLACE FUNCTION public.calculate_bom_cost(p_product_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_total_cost numeric := 0;
BEGIN
  SELECT COALESCE(SUM(bom.quantity * COALESCE(bom.cost_per_unit, p.purchase_price, 0) * (1 + bom.waste_percentage / 100)), 0)
  INTO v_total_cost FROM public.production_bom bom LEFT JOIN public.products p ON bom.component_product_id = p.id WHERE bom.product_id = p_product_id;
  RETURN v_total_cost;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_prediction_accuracy(p_tenant_id uuid, p_branch_id uuid DEFAULT NULL, p_days int DEFAULT 30)
RETURNS TABLE(avg_accuracy numeric, prediction_count bigint, low_risk_days bigint, high_risk_days bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT AVG(accuracy_score) as avg_accuracy, COUNT(*) as prediction_count,
    COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk_days,
    COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical')) as high_risk_days
  FROM public.cash_flow_predictions WHERE tenant_id = p_tenant_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND prediction_date >= CURRENT_DATE - p_days AND actual_balance IS NOT NULL AND scenario_type = 'realistic';
END;
$$;