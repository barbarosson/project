/*
  # Create Missing Database Views

  Creates 6 views referenced by frontend code that aggregate data.

  1. New Views
    - `transactions_with_invoice_details` - Transactions with linked invoice info
    - `warehouse_inventory_summary` - Product stock across warehouses
    - `production_cost_analytics` - Production order cost breakdowns
    - `project_financial_summary` - Project budget vs actual financials
    - `branch_performance_summary` - Revenue/expense/profit by branch
    - `v_customer_360` - Customer 360 view with CRM AI insights

  2. Notes
    - All views use LEFT JOINs for graceful handling of missing data
    - Column names match actual table schemas
*/

-- =============================================
-- 1. transactions_with_invoice_details
-- =============================================
CREATE OR REPLACE VIEW transactions_with_invoice_details AS
SELECT
  t.id,
  t.tenant_id,
  t.account_id,
  COALESCE(t.transaction_type, t.type) AS transaction_type,
  t.amount,
  COALESCE(t.currency, 'TRY') AS currency,
  COALESCE(t.transaction_date, t.created_at) AS transaction_date,
  COALESCE(t.description, '') AS description,
  t.reference_type,
  t.reference_id,
  t.customer_id,
  COALESCE(t.payment_method, 'bank_transfer') AS payment_method,
  t.notes,
  t.created_at,
  CASE
    WHEN t.reference_type = 'invoice' AND t.reference_id IS NOT NULL
    THEN inv.invoice_number
    ELSE NULL
  END AS invoice_number,
  CASE
    WHEN t.reference_type = 'invoice' AND t.reference_id IS NOT NULL
    THEN inv.status
    ELSE NULL
  END AS invoice_status
FROM transactions t
LEFT JOIN invoices inv ON t.reference_type = 'invoice' AND t.reference_id = inv.id;

-- =============================================
-- 2. warehouse_inventory_summary
-- =============================================
CREATE OR REPLACE VIEW warehouse_inventory_summary AS
SELECT
  w.id AS warehouse_id,
  w.tenant_id,
  w.name AS warehouse_name,
  w.code AS warehouse_code,
  w.location AS warehouse_location,
  w.is_main,
  w.is_active,
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.category,
  COALESCE(p.unit, 'adet') AS unit,
  COALESCE(p.min_stock_level, 0) AS critical_level,
  COALESCE(p.purchase_price, 0) AS purchase_price,
  COALESCE(p.sale_price, 0) AS sale_price,
  COALESCE(p.average_cost, 0) AS average_cost,
  COALESCE(ws.quantity, 0) AS warehouse_quantity,
  COALESCE(ws.reserved_quantity, 0) AS reserved_quantity,
  COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0) AS available_quantity,
  COALESCE(ws.quantity, 0) * COALESCE(p.average_cost, 0) AS stock_value,
  ws.last_counted_at,
  CASE
    WHEN COALESCE(ws.quantity, 0) <= 0 THEN 'out_of_stock'
    WHEN COALESCE(ws.quantity, 0) <= COALESCE(p.min_stock_level, 0) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM warehouses w
CROSS JOIN products p
LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id AND ws.product_id = p.id
WHERE w.is_active = true AND p.is_active = true;

-- =============================================
-- 3. production_cost_analytics
-- Uses actual column names: planned_quantity, actual_quantity, hours_worked, hourly_rate
-- =============================================
CREATE OR REPLACE VIEW production_cost_analytics AS
SELECT
  po.id AS production_order_id,
  po.tenant_id,
  po.order_number,
  po.product_id,
  po.product_name,
  po.status,
  po.quantity_target,
  po.quantity_produced,
  po.estimated_unit_cost,
  po.planned_start_date,
  po.planned_end_date,
  po.actual_start_date,
  po.actual_end_date,
  po.waste_percent,
  po.project_id,
  COALESCE(bom_cost.total_material_cost, 0) AS total_material_cost,
  COALESCE(po.estimated_unit_cost * po.quantity_target, 0) AS planned_material_cost,
  COALESCE(labor_cost.total_labor_cost, 0) AS total_labor_cost,
  COALESCE(labor_cost.total_labor_hours, 0) AS total_labor_hours,
  0::numeric AS total_overhead_cost,
  COALESCE(bom_cost.total_material_cost, 0) + COALESCE(labor_cost.total_labor_cost, 0) AS total_production_cost,
  CASE
    WHEN po.quantity_produced > 0
    THEN (COALESCE(bom_cost.total_material_cost, 0) + COALESCE(labor_cost.total_labor_cost, 0)) / po.quantity_produced
    ELSE 0
  END AS actual_unit_cost,
  CASE
    WHEN COALESCE(po.estimated_unit_cost * po.quantity_target, 0) > 0
    THEN ((COALESCE(bom_cost.total_material_cost, 0) - COALESCE(po.estimated_unit_cost * po.quantity_target, 0))
      / (po.estimated_unit_cost * po.quantity_target)) * 100
    ELSE 0
  END AS material_variance_percent,
  CASE
    WHEN po.quantity_target > 0
    THEN (COALESCE(po.quantity_produced, 0)::numeric / po.quantity_target) * 100
    ELSE 0
  END AS completion_percent
FROM production_orders po
LEFT JOIN (
  SELECT
    bi.production_order_id,
    SUM(COALESCE(bi.actual_quantity, bi.planned_quantity) * COALESCE(bi.unit_cost, 0)) AS total_material_cost
  FROM production_bom_items bi
  GROUP BY bi.production_order_id
) bom_cost ON bom_cost.production_order_id = po.id
LEFT JOIN (
  SELECT
    le.production_order_id,
    SUM(le.hours_worked * le.hourly_rate) AS total_labor_cost,
    SUM(le.hours_worked) AS total_labor_hours
  FROM production_labor_entries le
  GROUP BY le.production_order_id
) labor_cost ON labor_cost.production_order_id = po.id;

-- =============================================
-- 4. project_financial_summary
-- =============================================
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT
  p.id AS project_id,
  p.tenant_id,
  p.name,
  COALESCE(p.budget, 0) AS budget,
  COALESCE(p.currency, 'TRY') AS currency,
  p.status,
  COALESCE(rev.total_revenue, 0) AS total_revenue,
  COALESCE(exp_data.total_expenses, 0) AS total_expenses,
  COALESCE(mat.total_material_cost, 0) AS total_material_cost,
  COALESCE(cost_data.total_labor_other, 0) AS total_labor_other,
  COALESCE(exp_data.total_expenses, 0) + COALESCE(mat.total_material_cost, 0) + COALESCE(cost_data.total_labor_other, 0) AS total_cost,
  COALESCE(rev.total_revenue, 0) - (COALESCE(exp_data.total_expenses, 0) + COALESCE(mat.total_material_cost, 0) + COALESCE(cost_data.total_labor_other, 0)) AS net_profit,
  CASE
    WHEN COALESCE(p.budget, 0) > 0
    THEN ((COALESCE(exp_data.total_expenses, 0) + COALESCE(mat.total_material_cost, 0) + COALESCE(cost_data.total_labor_other, 0)) / p.budget) * 100
    ELSE 0
  END AS budget_consumption_percent
FROM projects p
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_revenue
  FROM invoices
  WHERE project_id IS NOT NULL AND status != 'cancelled'
  GROUP BY project_id
) rev ON rev.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_expenses
  FROM expenses
  WHERE project_id IS NOT NULL
  GROUP BY project_id
) exp_data ON exp_data.project_id = p.id
LEFT JOIN (
  SELECT
    sm.project_id,
    SUM(COALESCE(sm.unit_cost, 0) * sm.quantity) AS total_material_cost
  FROM stock_movements sm
  WHERE sm.project_id IS NOT NULL AND sm.movement_type = 'out'
  GROUP BY sm.project_id
) mat ON mat.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount) AS total_labor_other
  FROM project_cost_entries
  GROUP BY project_id
) cost_data ON cost_data.project_id = p.id;

-- =============================================
-- 5. branch_performance_summary
-- =============================================
CREATE OR REPLACE VIEW branch_performance_summary AS
SELECT
  b.id AS branch_id,
  b.tenant_id,
  b.name AS branch_name,
  b.code AS branch_code,
  b.city,
  b.is_headquarters,
  b.is_active,
  b.manager_name,
  COALESCE(inv_data.revenue, 0) AS revenue,
  COALESCE(inv_data.invoice_count, 0) AS invoice_count,
  COALESCE(exp_data.expenses, 0) AS expenses,
  COALESCE(exp_data.expense_count, 0) AS expense_count,
  COALESCE(inv_data.revenue, 0) - COALESCE(exp_data.expenses, 0) AS profit,
  COALESCE(ord_data.order_count, 0) AS order_count,
  COALESCE(proj_data.project_count, 0) AS project_count,
  CASE
    WHEN COALESCE(inv_data.revenue, 0) > 0
    THEN ((COALESCE(inv_data.revenue, 0) - COALESCE(exp_data.expenses, 0)) / inv_data.revenue) * 100
    ELSE 0
  END AS profit_margin_pct
FROM branches b
LEFT JOIN (
  SELECT branch_id, SUM(amount) AS revenue, COUNT(*) AS invoice_count
  FROM invoices
  WHERE branch_id IS NOT NULL AND status != 'cancelled'
  GROUP BY branch_id
) inv_data ON inv_data.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, SUM(amount) AS expenses, COUNT(*) AS expense_count
  FROM expenses
  WHERE branch_id IS NOT NULL
  GROUP BY branch_id
) exp_data ON exp_data.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS order_count
  FROM orders
  WHERE branch_id IS NOT NULL
  GROUP BY branch_id
) ord_data ON ord_data.branch_id = b.id
LEFT JOIN (
  SELECT branch_id, COUNT(*) AS project_count
  FROM projects
  WHERE branch_id IS NOT NULL
  GROUP BY branch_id
) proj_data ON proj_data.branch_id = b.id;

-- =============================================
-- 6. v_customer_360
-- =============================================
CREATE OR REPLACE VIEW v_customer_360 AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.tenant_id,
  COALESCE(c.segment, 'Regular') AS segment,
  COALESCE(c.clv, 0) AS clv,
  COALESCE(c.payment_score, 0) AS payment_score,
  COALESCE(c.churn_probability, 0) AS churn_probability,
  COALESCE(c.churn_risk_level, 'low') AS churn_risk_level,
  COALESCE(c.health_score, 0) AS health_score,
  COALESCE(c.total_orders, 0) AS total_orders,
  COALESCE(c.total_revenue, 0) AS total_revenue,
  COALESCE(c.average_order_value, 0) AS average_order_value,
  COALESCE(c.days_since_last_order, 0) AS days_since_last_order,
  CASE
    WHEN COALESCE(c.total_invoices, 0) > 0
    THEN (COALESCE(c.paid_on_time_count, 0)::numeric / c.total_invoices) * 100
    ELSE 0
  END AS on_time_payment_rate,
  COALESCE(c.average_payment_delay_days, 0) AS average_payment_delay_days,
  ai.recommended_actions,
  ai.engagement_score,
  ai.next_purchase_prediction
FROM customers c
LEFT JOIN crm_ai_insights ai ON ai.customer_id = c.id;
