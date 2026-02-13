/*
  # AI Production Decision System - Core Tables
  Tables: production_recipes, production_recipe_items, ai_production_suggestions
*/

CREATE TABLE IF NOT EXISTS public.production_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, branch_id UUID,
  finished_good_id UUID NOT NULL, recipe_name TEXT NOT NULL, version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true, batch_size DECIMAL(15,3) DEFAULT 1,
  production_time_minutes INTEGER DEFAULT 60, setup_time_minutes INTEGER DEFAULT 0,
  labor_cost_per_unit DECIMAL(15,2) DEFAULT 0, overhead_cost_per_unit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID,
  CONSTRAINT unique_recipe_version UNIQUE (tenant_id, finished_good_id, version)
);

CREATE INDEX IF NOT EXISTS idx_recipes_tenant ON public.production_recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_branch ON public.production_recipes(branch_id);
CREATE INDEX IF NOT EXISTS idx_recipes_finished_good ON public.production_recipes(finished_good_id);

CREATE TABLE IF NOT EXISTS public.production_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipe_id UUID NOT NULL, raw_material_id UUID NOT NULL,
  quantity_required DECIMAL(15,3) NOT NULL CHECK (quantity_required > 0), unit_of_measure TEXT NOT NULL,
  scrap_factor DECIMAL(5,4) DEFAULT 1.05, waste_percentage DECIMAL(5,2) DEFAULT 5.0,
  estimated_unit_cost DECIMAL(15,2), is_substitute BOOLEAN DEFAULT false, substitute_for UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON public.production_recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_material ON public.production_recipe_items(raw_material_id);

CREATE TABLE IF NOT EXISTS public.ai_production_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, branch_id UUID,
  product_id UUID NOT NULL, recipe_id UUID, suggested_quantity INTEGER NOT NULL CHECK (suggested_quantity > 0),
  priority_score DECIMAL(3,2) CHECK (priority_score BETWEEN 0 AND 1),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  reasoning TEXT NOT NULL, confidence_score DECIMAL(3,2) DEFAULT 0.8,
  estimated_revenue DECIMAL(15,2), estimated_cost DECIMAL(15,2), estimated_profit DECIMAL(15,2),
  profit_margin_percentage DECIMAL(5,2), roi_percentage DECIMAL(5,2),
  cash_impact_status TEXT CHECK (cash_impact_status IN ('safe', 'moderate', 'risky', 'critical')),
  cash_required DECIMAL(15,2), cash_runway_impact_days INTEGER,
  current_stock_level INTEGER, minimum_stock_level INTEGER, pending_orders_quantity INTEGER DEFAULT 0,
  forecasted_demand INTEGER, stockout_risk_score DECIMAL(3,2),
  recommended_start_date DATE, estimated_completion_date DATE, production_lead_time_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'in_production', 'completed', 'expired')),
  production_order_id UUID, reviewed_by UUID, reviewed_at TIMESTAMPTZ, review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  model_version TEXT DEFAULT 'v1.0', calculation_factors JSONB
);

CREATE INDEX IF NOT EXISTS idx_suggestions_tenant ON public.ai_production_suggestions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_product ON public.ai_production_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.ai_production_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON public.ai_production_suggestions(priority_score DESC);

ALTER TABLE public.production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_production_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON public.production_recipes;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.production_recipe_items;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.ai_production_suggestions;

CREATE POLICY "Allow authenticated users" ON public.production_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users" ON public.production_recipe_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users" ON public.ai_production_suggestions FOR ALL TO authenticated USING (true) WITH CHECK (true);