/*
  # Integrated Project Commander Module

  1. New Tables
    - `projects` - Core project tracking with budget, dates, status, client link
    - `project_milestones` - Milestone/hakediş tracking with auto-invoice support
    - `project_cost_entries` - Denormalized cost ledger from linked records
    - `project_reservations` - Stock reservation per project

  2. Modified Tables
    - `invoices` - added `project_id` column
    - `orders` - added `project_id` column
    - `expenses` - added `project_id` column
    - `stock_movements` - added `project_id` column

  3. Security
    - RLS enabled on all new tables
    - Tenant-scoped via auth.jwt() app_metadata.tenant_id

  4. Views
    - `project_financial_summary` - Real-time aggregation of revenue, costs, profit
*/

-- ============================================
-- 1. Create projects table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'planning',
  client_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  budget numeric DEFAULT 0,
  currency text DEFAULT 'TRY',
  start_date date,
  end_date date,
  actual_start_date date,
  actual_end_date date,
  progress_percent integer DEFAULT 0,
  priority text DEFAULT 'medium',
  manager_name text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT projects_status_check CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT projects_progress_check CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(tenant_id, status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects tenant select"
  ON projects FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Projects tenant insert"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Projects tenant update"
  ON projects FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Projects tenant delete"
  ON projects FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================
-- 2. Create project_milestones table
-- ============================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  invoice_on_complete boolean DEFAULT false,
  invoice_amount numeric DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT milestones_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'))
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_tenant ON project_milestones(tenant_id);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones tenant select"
  ON project_milestones FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Milestones tenant insert"
  ON project_milestones FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Milestones tenant update"
  ON project_milestones FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Milestones tenant delete"
  ON project_milestones FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================
-- 3. Create project_cost_entries table
-- ============================================
CREATE TABLE IF NOT EXISTS project_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_type text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'TRY',
  reference_type text,
  reference_id uuid,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT cost_type_check CHECK (cost_type IN ('material', 'labor', 'expense', 'invoice', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_project_cost_entries_project ON project_cost_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_cost_entries_tenant ON project_cost_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_cost_entries_ref ON project_cost_entries(reference_type, reference_id);

ALTER TABLE project_cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cost entries tenant select"
  ON project_cost_entries FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Cost entries tenant insert"
  ON project_cost_entries FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Cost entries tenant update"
  ON project_cost_entries FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Cost entries tenant delete"
  ON project_cost_entries FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================
-- 4. Create project_reservations table
-- ============================================
CREATE TABLE IF NOT EXISTS project_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reserved_quantity numeric NOT NULL DEFAULT 0,
  used_quantity numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT reservation_status_check CHECK (status IN ('reserved', 'partially_used', 'fully_used', 'released'))
);

CREATE INDEX IF NOT EXISTS idx_project_reservations_project ON project_reservations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reservations_product ON project_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_project_reservations_tenant ON project_reservations(tenant_id);

ALTER TABLE project_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservations tenant select"
  ON project_reservations FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Reservations tenant insert"
  ON project_reservations FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Reservations tenant update"
  ON project_reservations FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "Reservations tenant delete"
  ON project_reservations FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================
-- 5. Add project_id to existing tables
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX idx_invoices_project_id ON invoices(project_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX idx_orders_project_id ON orders(project_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX idx_expenses_project_id ON expenses(project_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX idx_stock_movements_project_id ON stock_movements(project_id);
  END IF;
END $$;

-- ============================================
-- 6. Create project financial summary view
-- ============================================
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT
  p.id AS project_id,
  p.tenant_id,
  p.name,
  p.budget,
  p.currency,
  p.status,
  COALESCE(inv_revenue.total_revenue, 0) AS total_revenue,
  COALESCE(exp_cost.total_expenses, 0) AS total_expenses,
  COALESCE(mat_cost.total_material_cost, 0) AS total_material_cost,
  COALESCE(cost_entries.total_labor_other, 0) AS total_labor_other,
  (
    COALESCE(exp_cost.total_expenses, 0) +
    COALESCE(mat_cost.total_material_cost, 0) +
    COALESCE(cost_entries.total_labor_other, 0)
  ) AS total_cost,
  COALESCE(inv_revenue.total_revenue, 0) - (
    COALESCE(exp_cost.total_expenses, 0) +
    COALESCE(mat_cost.total_material_cost, 0) +
    COALESCE(cost_entries.total_labor_other, 0)
  ) AS net_profit,
  CASE
    WHEN p.budget > 0 THEN ROUND(
      (
        COALESCE(exp_cost.total_expenses, 0) +
        COALESCE(mat_cost.total_material_cost, 0) +
        COALESCE(cost_entries.total_labor_other, 0)
      ) / p.budget * 100, 1
    )
    ELSE 0
  END AS budget_consumption_percent
FROM projects p
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(i.total), 0) AS total_revenue
  FROM invoices i
  WHERE i.project_id = p.id AND i.tenant_id = p.tenant_id
    AND i.status NOT IN ('cancelled', 'draft')
) inv_revenue ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(e.amount), 0) AS total_expenses
  FROM expenses e
  WHERE e.project_id = p.id AND e.tenant_id = p.tenant_id
) exp_cost ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(sm.quantity * COALESCE(sm.unit_cost, 0)), 0) AS total_material_cost
  FROM stock_movements sm
  WHERE sm.project_id = p.id AND sm.tenant_id = p.tenant_id
    AND sm.movement_type = 'out'
) mat_cost ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(pce.amount), 0) AS total_labor_other
  FROM project_cost_entries pce
  WHERE pce.project_id = p.id AND pce.tenant_id = p.tenant_id
) cost_entries ON true;
