/*
  # Security Definer View'ları Security Invoker'a Çevirme

  Supabase veritabanı linter'ının raporladığı 11 adet "Security Definer View"
  hatasını giderir. Her view DROP edilip aynı yapıda ancak security_invoker = true
  ile yeniden oluşturulur.

  Etkilenen view'lar:
  - production_cost_analytics, v_customer_360, v_project_financial_health,
  - transactions_with_invoice_details, v_production_cost_breakdown,
  - v_branch_performance_metrics, v_cash_flow_forecast_30d, project_financial_summary,
  - warehouse_inventory_summary, v_project_financial_summary, branch_performance_summary

  RLS ETKİSİ (kısa):
  - SECURITY DEFINER: View, sahibi (owner) kullanıcının yetkileriyle çalışır; RLS atlanır.
  - SECURITY INVOKER: View, sorguyu çalıştıran kullanıcının yetkileriyle çalışır; alt
    tablolardaki RLS politikaları uygulanır. Daha güvenli ve tenant veri izolasyonu korunur.
  Postgres 15+ için WITH (security_invoker = true) kullanılıyor.
*/

-- =============================================
-- 1. transactions_with_invoice_details
-- =============================================
DROP VIEW IF EXISTS public.transactions_with_invoice_details;

CREATE VIEW public.transactions_with_invoice_details
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.tenant_id,
  t.account_id,
  t.transaction_type AS transaction_type,
  t.amount,
  COALESCE(t.currency, 'TRY') AS currency,
  COALESCE(t.transaction_date, (t.created_at)::date) AS transaction_date,
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
DROP VIEW IF EXISTS public.warehouse_inventory_summary;

CREATE VIEW public.warehouse_inventory_summary
WITH (security_invoker = true) AS
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
-- =============================================
DROP VIEW IF EXISTS public.production_cost_analytics;

CREATE VIEW public.production_cost_analytics
WITH (security_invoker = true) AS
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
DROP VIEW IF EXISTS public.project_financial_summary;

CREATE VIEW public.project_financial_summary
WITH (security_invoker = true) AS
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
DROP VIEW IF EXISTS public.branch_performance_summary;

CREATE VIEW public.branch_performance_summary
WITH (security_invoker = true) AS
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
DROP VIEW IF EXISTS public.v_customer_360;

CREATE VIEW public.v_customer_360
WITH (security_invoker = true) AS
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

-- =============================================
-- 7. v_project_financial_health
-- =============================================
DROP VIEW IF EXISTS public.v_project_financial_health;

CREATE VIEW public.v_project_financial_health
WITH (security_invoker = true) AS
SELECT
  pr.id AS project_id,
  pr.tenant_id,
  pr.name AS project_name,
  pr.status,
  pr.budget,
  COALESCE(pr.actual_cost, 0) AS actual_cost,
  pr.budget - COALESCE(pr.actual_cost, 0) AS remaining_budget,
  CASE
    WHEN pr.budget > 0 THEN
      ROUND(((pr.budget - COALESCE(pr.actual_cost, 0)) / pr.budget * 100)::numeric, 2)
    ELSE 0
  END AS profit_margin_percent,
  CASE
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget THEN 'OVER_BUDGET'
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget * 0.9 THEN 'AT_RISK'
    WHEN COALESCE(pr.actual_cost, 0) > pr.budget * 0.75 THEN 'ON_TRACK'
    ELSE 'HEALTHY'
  END AS budget_status,
  COALESCE((
    SELECT COUNT(*)
    FROM expenses
    WHERE project_id = pr.id
  ), 0) AS expense_count,
  pr.start_date,
  pr.end_date
FROM projects pr;

-- =============================================
-- 8. v_cash_flow_forecast_30d
-- =============================================
DROP VIEW IF EXISTS public.v_cash_flow_forecast_30d;

CREATE VIEW public.v_cash_flow_forecast_30d
WITH (security_invoker = true) AS
SELECT
  t.id AS tenant_id,
  COALESCE((
    SELECT SUM(current_balance)
    FROM accounts
    WHERE tenant_id = t.id
    AND is_active = true
  ), 0) AS current_cash_balance,
  COALESCE((
    SELECT SUM(total - COALESCE(paid_amount, 0))
    FROM invoices
    WHERE tenant_id = t.id
    AND status IN ('sent', 'overdue', 'partially_paid')
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) AS receivables_30d,
  COALESCE((
    SELECT SUM(total_amount)
    FROM purchase_orders
    WHERE tenant_id = t.id
    AND status IN ('approved', 'ordered')
    AND expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ), 0) AS payables_30d,
  COALESCE((
    SELECT SUM(amount)
    FROM expenses
    WHERE tenant_id = t.id
    AND status = 'approved'
  ), 0) AS pending_expenses,
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
  ), 0) AS projected_balance_30d
FROM tenants t;

-- =============================================
-- 9. v_project_financial_summary
-- =============================================
DROP VIEW IF EXISTS public.v_project_financial_summary;

CREATE VIEW public.v_project_financial_summary
WITH (security_invoker = true) AS
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

-- =============================================
-- 10. v_production_cost_breakdown
-- =============================================
DROP VIEW IF EXISTS public.v_production_cost_breakdown;

CREATE VIEW public.v_production_cost_breakdown
WITH (security_invoker = true) AS
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

-- =============================================
-- 11. v_branch_performance_metrics
-- =============================================
DROP VIEW IF EXISTS public.v_branch_performance_metrics;

CREATE VIEW public.v_branch_performance_metrics
WITH (security_invoker = true) AS
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
