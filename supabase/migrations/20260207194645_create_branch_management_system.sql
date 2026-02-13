/*
  # Create Branch Management System (Sube Takip Modulu)

  Regional profit-center tracking that links every transaction (invoices,
  orders, expenses, projects) to a physical or logical branch, enabling
  cross-branch performance comparison and AI-driven resource optimization.

  1. New Tables
    - `branches` - Master branch/location data
      - `id` (uuid, PK)
      - `tenant_id` (uuid, NOT NULL)
      - `name` (text, NOT NULL)
      - `code` (text, short identifier)
      - `city` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `manager_name` (text)
      - `is_headquarters` (boolean, marks the main branch)
      - `is_active` (boolean)
      - `notes` (text)

    - `branch_targets` - Monthly revenue/expense targets per branch
      - `id` (uuid, PK)
      - `branch_id` (uuid, FK)
      - `tenant_id` (uuid)
      - `month` (date, first day of month)
      - `revenue_target` (numeric)
      - `expense_budget` (numeric)

  2. Altered Tables
    - `invoices` - Added `branch_id` column
    - `orders` - Added `branch_id` column
    - `expenses` - Added `branch_id` column
    - `projects` - Added `branch_id` column

  3. Views
    - `branch_performance_summary` - Real-time revenue, expense, profit
      per branch computed from invoices and expenses

  4. Security
    - RLS enabled on all new tables
    - Tenant-isolated policies for SELECT, INSERT, UPDATE, DELETE
*/

-- ============================================================
-- 1. BRANCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  code text DEFAULT '',
  city text DEFAULT '',
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  manager_name text DEFAULT '',
  is_headquarters boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_branches_hq ON branches(is_headquarters) WHERE is_headquarters = true;

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select"
  ON branches FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branches_insert"
  ON branches FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branches_update"
  ON branches FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branches_delete"
  ON branches FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 2. BRANCH TARGETS (monthly goals per branch)
-- ============================================================
CREATE TABLE IF NOT EXISTS branch_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  month date NOT NULL,
  revenue_target numeric NOT NULL DEFAULT 0,
  expense_budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT branch_targets_unique UNIQUE (branch_id, month)
);

CREATE INDEX IF NOT EXISTS idx_branch_targets_tenant ON branch_targets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branch_targets_branch ON branch_targets(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_targets_month ON branch_targets(month);

ALTER TABLE branch_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branch_targets_select"
  ON branch_targets FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branch_targets_insert"
  ON branch_targets FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branch_targets_update"
  ON branch_targets FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "branch_targets_delete"
  ON branch_targets FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 3. ADD branch_id TO MAJOR TRANSACTION TABLES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_projects_branch ON projects(branch_id);

-- ============================================================
-- 4. BRANCH PERFORMANCE SUMMARY VIEW
--    Revenue = sum of invoice totals (sales)
--    Expenses = sum of expenses table amounts
--    Profit = Revenue - Expenses
-- ============================================================
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
  COALESCE(exp_data.total_expenses, 0) AS expenses,
  COALESCE(exp_data.expense_count, 0) AS expense_count,
  COALESCE(inv_data.revenue, 0) - COALESCE(exp_data.total_expenses, 0) AS profit,
  COALESCE(ord_data.order_count, 0) AS order_count,
  COALESCE(proj_data.project_count, 0) AS project_count,

  CASE
    WHEN COALESCE(inv_data.revenue, 0) = 0 THEN 0
    ELSE ROUND(
      ((COALESCE(inv_data.revenue, 0) - COALESCE(exp_data.total_expenses, 0))
       / NULLIF(COALESCE(inv_data.revenue, 0), 0)) * 100, 1
    )
  END AS profit_margin_pct

FROM branches b

LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(COALESCE(i.total, 0)), 0) AS revenue,
    COUNT(*)::int AS invoice_count
  FROM invoices i
  WHERE i.branch_id = b.id AND i.status NOT IN ('cancelled', 'draft')
) inv_data ON true

LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(COALESCE(e.amount, 0)), 0) AS total_expenses,
    COUNT(*)::int AS expense_count
  FROM expenses e
  WHERE e.branch_id = b.id
) exp_data ON true

LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS order_count
  FROM orders o
  WHERE o.branch_id = b.id
) ord_data ON true

LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS project_count
  FROM projects p
  WHERE p.branch_id = b.id
) proj_data ON true;
