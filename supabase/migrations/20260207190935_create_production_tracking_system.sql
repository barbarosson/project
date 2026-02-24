/*
  # Create Production Tracking System

  A "Transformation Engine" module that converts raw materials and labor into
  finished goods while calculating precise unit costs in real-time.

  1. New Tables
    - `production_orders` - Main production run records
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, NOT NULL)
      - `order_number` (text, auto-generated PO-XXXX)
      - `product_id` (uuid, FK to products - the finished good)
      - `product_name` (text, snapshot of product name)
      - `quantity_target` (numeric, target output)
      - `quantity_produced` (numeric, actual output so far)
      - `status` (text: planned / in_progress / qc_phase / completed / cancelled)
      - `priority` (text: low / medium / high / critical)
      - `planned_start_date` / `planned_end_date` (date)
      - `actual_start_date` / `actual_end_date` (date)
      - `estimated_unit_cost` (numeric)
      - `notes` (text)
      - `project_id` (uuid, optional FK to projects for cross-module link)

    - `production_bom_items` - Bill of Materials (Recipe) for each production order
      - `id` (uuid, primary key)
      - `production_order_id` (uuid, FK to production_orders)
      - `product_id` (uuid, FK to products - the raw material)
      - `product_name` (text, snapshot)
      - `planned_quantity` (numeric, recipe amount)
      - `actual_quantity` (numeric, consumed amount)
      - `unit_cost` (numeric, cost per unit at time of consumption)
      - `unit` (text)
      - `notes` (text)

    - `production_labor_entries` - Labor hours logged against production orders
      - `id` (uuid, primary key)
      - `production_order_id` (uuid, FK to production_orders)
      - `worker_name` (text)
      - `role` (text)
      - `hours_worked` (numeric)
      - `hourly_rate` (numeric)
      - `work_date` (date)
      - `notes` (text)

    - `production_quality_checks` - QC records per production order
      - `id` (uuid, primary key)
      - `production_order_id` (uuid, FK to production_orders)
      - `check_type` (text)
      - `result` (text: passed / failed / conditional)
      - `checked_by` (text)
      - `checked_at` (timestamptz)
      - `defect_count` (integer)
      - `notes` (text)

  2. Altered Tables
    - `stock_movements` - Added `production_order_id` column
    - `expenses` - Added `production_order_id` column

  3. Views
    - `production_cost_analytics` - Real-time unit cost calculation view

  4. Security
    - RLS enabled on all new tables
    - Tenant-isolated SELECT, INSERT, UPDATE, DELETE policies
*/

-- ============================================================
-- 1. PRODUCTION ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_number text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity_target numeric NOT NULL DEFAULT 1 CHECK (quantity_target > 0),
  quantity_produced numeric NOT NULL DEFAULT 0 CHECK (quantity_produced >= 0),
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'qc_phase', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  estimated_unit_cost numeric DEFAULT 0,
  waste_percent numeric DEFAULT 0,
  notes text DEFAULT '',
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_orders_tenant ON production_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_product ON production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_project ON production_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_created ON production_orders(created_at DESC);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_orders_select"
  ON production_orders FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "production_orders_insert"
  ON production_orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "production_orders_update"
  ON production_orders FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "production_orders_delete"
  ON production_orders FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 2. BILL OF MATERIALS (BOM) ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS production_bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  planned_quantity numeric NOT NULL DEFAULT 0 CHECK (planned_quantity >= 0),
  actual_quantity numeric NOT NULL DEFAULT 0 CHECK (actual_quantity >= 0),
  unit_cost numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'piece',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bom_items_order ON production_bom_items(production_order_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_product ON production_bom_items(product_id);

ALTER TABLE production_bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bom_items_select"
  ON production_bom_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "bom_items_insert"
  ON production_bom_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "bom_items_update"
  ON production_bom_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "bom_items_delete"
  ON production_bom_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

-- ============================================================
-- 3. LABOR ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS production_labor_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  worker_name text NOT NULL DEFAULT '',
  role text DEFAULT '',
  hours_worked numeric NOT NULL DEFAULT 0 CHECK (hours_worked >= 0),
  hourly_rate numeric NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  work_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labor_entries_order ON production_labor_entries(production_order_id);

ALTER TABLE production_labor_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labor_entries_select"
  ON production_labor_entries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "labor_entries_insert"
  ON production_labor_entries FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "labor_entries_update"
  ON production_labor_entries FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "labor_entries_delete"
  ON production_labor_entries FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

-- ============================================================
-- 4. QUALITY CHECKS
-- ============================================================
CREATE TABLE IF NOT EXISTS production_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  check_type text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT 'passed'
    CHECK (result IN ('passed', 'failed', 'conditional')),
  checked_by text DEFAULT '',
  checked_at timestamptz DEFAULT now(),
  defect_count integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qc_checks_order ON production_quality_checks(production_order_id);

ALTER TABLE production_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qc_checks_select"
  ON production_quality_checks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "qc_checks_insert"
  ON production_quality_checks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "qc_checks_update"
  ON production_quality_checks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "qc_checks_delete"
  ON production_quality_checks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

-- ============================================================
-- 5. LINK STOCK_MOVEMENTS & EXPENSES TO PRODUCTION
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'production_order_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN production_order_id uuid REFERENCES production_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_movements_production ON stock_movements(production_order_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'production_order_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN production_order_id uuid REFERENCES production_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_production ON expenses(production_order_id);

-- ============================================================
-- 6. PRODUCTION COST ANALYTICS VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.production_cost_analytics
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

  COALESCE(bom_agg.total_material_cost, 0) AS total_material_cost,
  COALESCE(bom_agg.planned_material_cost, 0) AS planned_material_cost,

  COALESCE(labor_agg.total_labor_cost, 0) AS total_labor_cost,
  COALESCE(labor_agg.total_labor_hours, 0) AS total_labor_hours,

  COALESCE(exp_agg.total_overhead_cost, 0) AS total_overhead_cost,

  (COALESCE(bom_agg.total_material_cost, 0)
   + COALESCE(labor_agg.total_labor_cost, 0)
   + COALESCE(exp_agg.total_overhead_cost, 0)) AS total_production_cost,

  CASE
    WHEN po.quantity_produced > 0 THEN
      (COALESCE(bom_agg.total_material_cost, 0)
       + COALESCE(labor_agg.total_labor_cost, 0)
       + COALESCE(exp_agg.total_overhead_cost, 0)) / po.quantity_produced
    ELSE 0
  END AS actual_unit_cost,

  CASE
    WHEN COALESCE(bom_agg.planned_material_cost, 0) > 0 THEN
      ROUND(
        ((COALESCE(bom_agg.total_material_cost, 0) - COALESCE(bom_agg.planned_material_cost, 0))
         / COALESCE(bom_agg.planned_material_cost, 0)) * 100, 2)
    ELSE 0
  END AS material_variance_percent,

  CASE
    WHEN po.quantity_target > 0 THEN
      ROUND((po.quantity_produced::numeric / po.quantity_target) * 100, 1)
    ELSE 0
  END AS completion_percent

FROM production_orders po

LEFT JOIN LATERAL (
  SELECT
    SUM(b.actual_quantity * b.unit_cost) AS total_material_cost,
    SUM(b.planned_quantity * b.unit_cost) AS planned_material_cost
  FROM production_bom_items b
  WHERE b.production_order_id = po.id
) bom_agg ON true

LEFT JOIN LATERAL (
  SELECT
    SUM(l.hours_worked * l.hourly_rate) AS total_labor_cost,
    SUM(l.hours_worked) AS total_labor_hours
  FROM production_labor_entries l
  WHERE l.production_order_id = po.id
) labor_agg ON true

LEFT JOIN LATERAL (
  SELECT
    SUM(e.amount) AS total_overhead_cost
  FROM expenses e
  WHERE e.production_order_id = po.id
) exp_agg ON true;
