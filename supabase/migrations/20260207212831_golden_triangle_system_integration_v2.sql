/*
  # Golden Triangle System Integration V2

  This migration implements the 3 critical automation workflows:
  
  1. **Expense → Project Cost Impact**
     Add actual_cost column to projects and auto-update
     
  2. **Supply Chain Intelligence Views**
     AI-ready views for stock monitoring and procurement
     
  3. **Cash Flow Forecasting**
     30-day financial projection for cash management

  All functions use SECURITY DEFINER with search_path = public
*/

-- ============================================================
-- ADD MISSING PROJECT COST TRACKING
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'actual_cost'
  ) THEN
    ALTER TABLE projects ADD COLUMN actual_cost numeric(15,2) DEFAULT 0;
    
    -- Initialize with existing expense data
    UPDATE projects p
    SET actual_cost = (
      SELECT COALESCE(SUM(e.amount), 0)
      FROM expenses e
      WHERE e.project_id = p.id
      AND e.status IN ('approved', 'paid')
    );
  END IF;
END $$;

-- ============================================================
-- CRITICAL WORKFLOW #1: Expense → Project Cost Impact
-- ============================================================

CREATE OR REPLACE FUNCTION sync_expense_to_project_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  IF v_project_id IS NOT NULL THEN
    UPDATE projects
    SET 
      actual_cost = (
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE project_id = v_project_id
        AND status IN ('approved', 'paid')
      ),
      updated_at = now()
    WHERE id = v_project_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_expense_to_project_cost ON expenses;
CREATE TRIGGER trigger_expense_to_project_cost
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_expense_to_project_cost();

-- ============================================================
-- AI VIEW #1: Supply Chain Intelligence
-- ============================================================

CREATE OR REPLACE VIEW v_supply_chain_intelligence AS
SELECT
  p.id as product_id,
  p.tenant_id,
  p.name as product_name,
  p.sku,
  p.stock_quantity,
  p.min_stock_level,
  p.purchase_price,
  
  -- Stock status classification
  CASE
    WHEN p.stock_quantity <= 0 THEN 'OUT_OF_STOCK'
    WHEN p.stock_quantity <= COALESCE(p.min_stock_level, 0) THEN 'CRITICAL'
    WHEN p.stock_quantity <= COALESCE(p.min_stock_level, 0) * 1.5 THEN 'LOW'
    ELSE 'NORMAL'
  END as stock_status,
  
  -- Recent demand (30 days)
  COALESCE((
    SELECT SUM(oi.quantity)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p.id
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ), 0) as demand_last_30d,
  
  -- Recommended reorder quantity
  CASE
    WHEN p.stock_quantity <= COALESCE(p.min_stock_level, 0) THEN
      GREATEST(COALESCE(p.min_stock_level, 10) * 2 - p.stock_quantity, 10)
    ELSE 0
  END as recommended_reorder_qty

FROM products p;

-- ============================================================
-- AI VIEW #2: Project Financial Health
-- ============================================================

CREATE OR REPLACE VIEW v_project_financial_health AS
SELECT
  pr.id as project_id,
  pr.tenant_id,
  pr.name as project_name,
  pr.status,
  pr.budget,
  COALESCE(pr.actual_cost, 0) as actual_cost,
  pr.budget - COALESCE(pr.actual_cost, 0) as remaining_budget,
  
  -- Profit margin calculation
  CASE
    WHEN pr.budget > 0 THEN
      ROUND(((pr.budget - COALESCE(pr.actual_cost, 0)) / pr.budget * 100)::numeric, 2)
    ELSE 0
  END as profit_margin_percent,
  
  -- Budget status
  CASE
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget THEN 'OVER_BUDGET'
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget * 0.9 THEN 'AT_RISK'
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget * 0.75 THEN 'ON_TRACK'
    ELSE 'HEALTHY'
  END as budget_status,
  
  -- Total expense count
  COALESCE((
    SELECT COUNT(*)
    FROM expenses
    WHERE project_id = pr.id
  ), 0) as expense_count,
  
  pr.start_date,
  pr.end_date

FROM projects pr;

-- ============================================================
-- AI VIEW #3: Cash Flow Forecast (30 days)
-- ============================================================

CREATE OR REPLACE VIEW v_cash_flow_forecast_30d AS
SELECT
  t.id as tenant_id,
  
  -- Current cash position
  COALESCE((
    SELECT SUM(current_balance)
    FROM accounts
    WHERE tenant_id = t.id
    AND is_active = true
  ), 0) as current_cash_balance,
  
  -- Expected receivables (invoices due in next 30 days)
  COALESCE((
    SELECT SUM(total - COALESCE(paid_amount, 0))
    FROM invoices
    WHERE tenant_id = t.id
    AND status IN ('sent', 'overdue', 'partially_paid')
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) as receivables_30d,
  
  -- Expected payables (purchase orders)
  COALESCE((
    SELECT SUM(total_amount)
    FROM purchase_orders
    WHERE tenant_id = t.id
    AND status IN ('approved', 'ordered')
    AND expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) as payables_30d,
  
  -- Pending expenses
  COALESCE((
    SELECT SUM(amount)
    FROM expenses
    WHERE tenant_id = t.id
    AND status = 'approved'
  ), 0) as pending_expenses,
  
  -- Projected balance (simple calculation)
  COALESCE((
    SELECT SUM(current_balance)
    FROM accounts
    WHERE tenant_id = t.id
    AND is_active = true
  ), 0) + 
  COALESCE((
    SELECT SUM(total - COALESCE(paid_amount, 0))
    FROM invoices
    WHERE tenant_id = t.id
    AND status IN ('sent', 'overdue', 'partially_paid')
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) -
  COALESCE((
    SELECT SUM(total_amount)
    FROM purchase_orders
    WHERE tenant_id = t.id
    AND status IN ('approved', 'ordered')
    AND expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) -
  COALESCE((
    SELECT SUM(amount)
    FROM expenses
    WHERE tenant_id = t.id
    AND status = 'approved'
  ), 0) as projected_balance_30d

FROM tenants t;

-- ============================================================
-- HELPER FUNCTIONS FOR AI AGENTS
-- ============================================================

-- Get supply chain recommendations
CREATE OR REPLACE FUNCTION get_supply_recommendations(p_tenant_id uuid)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  current_stock numeric,
  stock_status text,
  recommended_qty numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sci.product_id,
    sci.product_name,
    sci.stock_quantity,
    sci.stock_status,
    sci.recommended_reorder_qty
  FROM v_supply_chain_intelligence sci
  WHERE sci.tenant_id = p_tenant_id
  AND sci.stock_status IN ('OUT_OF_STOCK', 'CRITICAL', 'LOW')
  ORDER BY
    CASE sci.stock_status
      WHEN 'OUT_OF_STOCK' THEN 1
      WHEN 'CRITICAL' THEN 2
      WHEN 'LOW' THEN 3
    END;
END;
$$;

-- Get project budget alerts
CREATE OR REPLACE FUNCTION get_project_budget_alerts(p_tenant_id uuid)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  budget numeric,
  actual_cost numeric,
  budget_status text,
  profit_margin numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pfh.project_id,
    pfh.project_name,
    pfh.budget,
    pfh.actual_cost,
    pfh.budget_status,
    pfh.profit_margin_percent
  FROM v_project_financial_health pfh
  WHERE pfh.tenant_id = p_tenant_id
  AND pfh.status IN ('planning', 'in_progress')
  AND pfh.budget_status IN ('OVER_BUDGET', 'AT_RISK')
  ORDER BY
    CASE pfh.budget_status
      WHEN 'OVER_BUDGET' THEN 1
      WHEN 'AT_RISK' THEN 2
    END;
END;
$$;

-- Get cash flow status
CREATE OR REPLACE FUNCTION get_cash_flow_status(p_tenant_id uuid)
RETURNS TABLE (
  current_balance numeric,
  projected_balance_30d numeric,
  status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forecast RECORD;
BEGIN
  SELECT * INTO v_forecast
  FROM v_cash_flow_forecast_30d
  WHERE tenant_id = p_tenant_id;

  RETURN QUERY
  SELECT
    v_forecast.current_cash_balance,
    v_forecast.projected_balance_30d,
    CASE
      WHEN v_forecast.projected_balance_30d < 0 THEN 'CRITICAL'
      WHEN v_forecast.projected_balance_30d < v_forecast.current_cash_balance * 0.3 THEN 'WARNING'
      ELSE 'HEALTHY'
    END::text,
    CASE
      WHEN v_forecast.projected_balance_30d < 0 THEN
        'Critical: Negative cash position expected in 30 days'
      WHEN v_forecast.projected_balance_30d < v_forecast.current_cash_balance * 0.3 THEN
        'Warning: Cash buffer will drop significantly in 30 days'
      ELSE
        'Healthy: Positive cash flow projected'
    END::text;
END;
$$;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Indexes for AI query performance
CREATE INDEX IF NOT EXISTS idx_products_stock_intel 
  ON products(tenant_id, stock_quantity, min_stock_level);

CREATE INDEX IF NOT EXISTS idx_order_items_demand 
  ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_expenses_project_link 
  ON expenses(project_id, status) 
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_cash_due 
  ON invoices(tenant_id, status, due_date) 
  WHERE status IN ('sent', 'overdue', 'partially_paid');

CREATE INDEX IF NOT EXISTS idx_po_cash_expected 
  ON purchase_orders(tenant_id, status, expected_delivery_date) 
  WHERE status IN ('approved', 'ordered');

CREATE INDEX IF NOT EXISTS idx_projects_actual_cost
  ON projects(tenant_id, status, actual_cost, budget);
