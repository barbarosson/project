/*
  # AI Context Views and Functions (v3)

  Create views and functions to provide rich context for AI modules.
  Updated to match actual production_orders schema.

  1. Views
    - `v_project_financial_summary` - Project with linked invoices, expenses, orders
    - `v_production_cost_breakdown` - Production order with material costs
    - `v_branch_performance_metrics` - Branch-level KPIs

  2. Functions
    - `get_project_ai_context(project_id)` - Returns full context JSON for AI
    - `get_production_ai_context(production_id)` - Returns production context for AI
*/

-- ============================================================
-- 1. PROJECT FINANCIAL SUMMARY VIEW
-- ============================================================

CREATE OR REPLACE VIEW v_project_financial_summary AS
SELECT 
  p.id AS project_id,
  p.name AS project_name,
  p.status AS project_status,
  p.budget AS planned_budget,
  p.tenant_id,
  p.branch_id,
  COALESCE(inv_income.total_income, 0) AS total_income,
  COALESCE(exp_cost.total_expenses, 0) AS total_expenses,
  COALESCE(ord_cost.total_order_cost, 0) AS total_order_cost,
  COALESCE(prod_cost.total_production_cost, 0) AS total_production_cost,
  (COALESCE(exp_cost.total_expenses, 0) + COALESCE(ord_cost.total_order_cost, 0) + COALESCE(prod_cost.total_production_cost, 0)) AS total_spent,
  p.budget - (COALESCE(exp_cost.total_expenses, 0) + COALESCE(ord_cost.total_order_cost, 0) + COALESCE(prod_cost.total_production_cost, 0)) AS remaining_budget,
  CASE 
    WHEN p.budget > 0 THEN 
      ROUND(((COALESCE(exp_cost.total_expenses, 0) + COALESCE(ord_cost.total_order_cost, 0) + COALESCE(prod_cost.total_production_cost, 0)) / p.budget * 100)::numeric, 2)
    ELSE 0 
  END AS budget_utilization_pct
FROM projects p
LEFT JOIN (
  SELECT project_id, SUM(COALESCE(total, 0)) AS total_income
  FROM invoices 
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) inv_income ON inv_income.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_expenses
  FROM expenses 
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) exp_cost ON exp_cost.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(COALESCE(total, 0)) AS total_order_cost
  FROM orders 
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) ord_cost ON ord_cost.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(COALESCE(estimated_unit_cost, 0) * COALESCE(quantity_target, 0)) AS total_production_cost
  FROM production_orders 
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) prod_cost ON prod_cost.project_id = p.id;

-- ============================================================
-- 2. PRODUCTION COST BREAKDOWN VIEW
-- ============================================================

CREATE OR REPLACE VIEW v_production_cost_breakdown AS
SELECT 
  po.id AS production_order_id,
  po.order_number,
  po.status,
  po.tenant_id,
  po.branch_id,
  po.project_id,
  po.product_name,
  po.quantity_target AS planned_quantity,
  po.quantity_produced AS completed_quantity,
  po.estimated_unit_cost,
  (po.estimated_unit_cost * po.quantity_target) AS estimated_total_cost,
  COALESCE(material_cost.total_material, 0) AS material_cost,
  COALESCE(expense_cost.total_expense, 0) AS overhead_cost,
  CASE 
    WHEN po.quantity_produced > 0 THEN 
      ROUND(((COALESCE(material_cost.total_material, 0) + COALESCE(expense_cost.total_expense, 0)) / po.quantity_produced)::numeric, 2)
    ELSE 0 
  END AS actual_unit_cost
FROM production_orders po
LEFT JOIN (
  SELECT 
    production_order_id, 
    SUM(ABS(quantity) * COALESCE(unit_cost, 0)) AS total_material
  FROM stock_movements 
  WHERE production_order_id IS NOT NULL AND movement_type IN ('production_out', 'adjustment')
  GROUP BY production_order_id
) material_cost ON material_cost.production_order_id = po.id
LEFT JOIN (
  SELECT 
    production_order_id,
    SUM(amount) AS total_expense
  FROM expenses
  WHERE production_order_id IS NOT NULL
  GROUP BY production_order_id
) expense_cost ON expense_cost.production_order_id = po.id;

-- ============================================================
-- 3. BRANCH PERFORMANCE METRICS VIEW
-- ============================================================

CREATE OR REPLACE VIEW v_branch_performance_metrics AS
SELECT 
  b.id AS branch_id,
  b.name AS branch_name,
  b.tenant_id,
  COALESCE(inv_stats.invoice_count, 0) AS total_invoices,
  COALESCE(inv_stats.total_revenue, 0) AS total_revenue,
  COALESCE(exp_stats.expense_count, 0) AS total_expenses_count,
  COALESCE(exp_stats.total_expense_amount, 0) AS total_expense_amount,
  COALESCE(ord_stats.order_count, 0) AS total_orders,
  COALESCE(proj_stats.project_count, 0) AS total_projects,
  COALESCE(proj_stats.active_projects, 0) AS active_projects,
  COALESCE(prod_stats.production_count, 0) AS total_productions,
  COALESCE(cust_stats.customer_count, 0) AS total_customers,
  COALESCE(inv_stats.total_revenue, 0) - COALESCE(exp_stats.total_expense_amount, 0) AS net_profit
FROM branches b
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS invoice_count, SUM(COALESCE(total, 0)) AS total_revenue
  FROM invoices GROUP BY branch_id
) inv_stats ON inv_stats.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS expense_count, SUM(amount) AS total_expense_amount
  FROM expenses GROUP BY branch_id
) exp_stats ON exp_stats.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS order_count
  FROM orders GROUP BY branch_id
) ord_stats ON ord_stats.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS project_count, 
    COUNT(*) FILTER (WHERE status IN ('active', 'in_progress')) AS active_projects
  FROM projects GROUP BY branch_id
) proj_stats ON proj_stats.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS production_count
  FROM production_orders GROUP BY branch_id
) prod_stats ON prod_stats.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS customer_count
  FROM customers GROUP BY branch_id
) cust_stats ON cust_stats.branch_id = b.id;

-- ============================================================
-- 4. AI CONTEXT FUNCTION FOR PROJECTS
-- ============================================================

CREATE OR REPLACE FUNCTION get_project_ai_context(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'project', (
      SELECT row_to_json(p.*) FROM projects p WHERE p.id = p_project_id
    ),
    'financial_summary', (
      SELECT row_to_json(v.*) FROM v_project_financial_summary v WHERE v.project_id = p_project_id
    ),
    'recent_invoices', (
      SELECT COALESCE(jsonb_agg(row_to_json(i.*)), '[]'::jsonb)
      FROM (
        SELECT id, invoice_number, total, status, created_at
        FROM invoices WHERE project_id = p_project_id
        ORDER BY created_at DESC LIMIT 10
      ) i
    ),
    'recent_expenses', (
      SELECT COALESCE(jsonb_agg(row_to_json(e.*)), '[]'::jsonb)
      FROM (
        SELECT id, description, category, amount, expense_date
        FROM expenses WHERE project_id = p_project_id
        ORDER BY expense_date DESC LIMIT 10
      ) e
    ),
    'recent_stock_movements', (
      SELECT COALESCE(jsonb_agg(row_to_json(s.*)), '[]'::jsonb)
      FROM (
        SELECT sm.id, sm.movement_type, sm.quantity, sm.unit_cost, pr.name as product_name, sm.created_at
        FROM stock_movements sm
        LEFT JOIN products pr ON pr.id = sm.product_id
        WHERE sm.project_id = p_project_id
        ORDER BY sm.created_at DESC LIMIT 10
      ) s
    ),
    'milestones', (
      SELECT COALESCE(jsonb_agg(row_to_json(m.*)), '[]'::jsonb)
      FROM (
        SELECT id, title, status, due_date, completed_at
        FROM project_milestones WHERE project_id = p_project_id
        ORDER BY due_date
      ) m
    ),
    'production_orders', (
      SELECT COALESCE(jsonb_agg(row_to_json(po.*)), '[]'::jsonb)
      FROM (
        SELECT id, order_number, product_name, status, quantity_target, quantity_produced, estimated_unit_cost
        FROM production_orders WHERE project_id = p_project_id
        ORDER BY created_at DESC LIMIT 10
      ) po
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================
-- 5. AI CONTEXT FUNCTION FOR PRODUCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_production_ai_context(p_production_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'production_order', (
      SELECT row_to_json(po.*) FROM production_orders po WHERE po.id = p_production_id
    ),
    'cost_breakdown', (
      SELECT row_to_json(v.*) FROM v_production_cost_breakdown v WHERE v.production_order_id = p_production_id
    ),
    'bom_items', (
      SELECT COALESCE(jsonb_agg(row_to_json(b.*)), '[]'::jsonb)
      FROM (
        SELECT bi.id, bi.quantity, pr.name as material_name, pr.sku
        FROM production_bom_items bi
        LEFT JOIN products pr ON pr.id = bi.material_id
        WHERE bi.production_order_id = p_production_id
      ) b
    ),
    'stock_movements', (
      SELECT COALESCE(jsonb_agg(row_to_json(s.*)), '[]'::jsonb)
      FROM (
        SELECT sm.id, sm.movement_type, sm.quantity, sm.unit_cost, pr.name as product_name, sm.created_at
        FROM stock_movements sm
        LEFT JOIN products pr ON pr.id = sm.product_id
        WHERE sm.production_order_id = p_production_id
        ORDER BY sm.created_at DESC
      ) s
    ),
    'quality_checks', (
      SELECT COALESCE(jsonb_agg(row_to_json(q.*)), '[]'::jsonb)
      FROM (
        SELECT id, check_type, result, notes, checked_at
        FROM production_quality_checks
        WHERE production_order_id = p_production_id
        ORDER BY checked_at DESC
      ) q
    ),
    'related_expenses', (
      SELECT COALESCE(jsonb_agg(row_to_json(e.*)), '[]'::jsonb)
      FROM (
        SELECT id, description, category, amount, expense_date
        FROM expenses
        WHERE production_order_id = p_production_id
        ORDER BY expense_date DESC
      ) e
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================
-- 6. CREATE production_labor TABLE (for future use)
-- ============================================================

CREATE TABLE IF NOT EXISTS production_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  production_order_id uuid REFERENCES production_orders(id) ON DELETE CASCADE,
  worker_name text NOT NULL DEFAULT '',
  hours_worked numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL DEFAULT 0,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_labor_order ON production_labor(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_labor_tenant ON production_labor(tenant_id);

ALTER TABLE production_labor ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'production_labor' AND policyname = 'production_labor_tenant_isolation'
  ) THEN
    CREATE POLICY "production_labor_tenant_isolation"
      ON production_labor FOR ALL TO authenticated
      USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
      WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));
  END IF;
END $$;
