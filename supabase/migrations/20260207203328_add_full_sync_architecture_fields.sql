/*
  # Full-Sync Architecture - Add Missing Fields

  Per Modulus ERP Data Flow Map requirements, adding branch_id, created_by, 
  and metadata fields to all operational tables for:
  - Regional reporting (branch_id)
  - Audit trail (created_by)
  - AI context and future extensibility (metadata)

  1. Changes
    - Add branch_id to: production_orders, stock_movements, customers, products, warehouses
    - Add created_by to: invoices, orders, production_orders, customers, products, projects, warehouses, branches
    - Add metadata (jsonb) to: ALL operational tables

  2. Foreign Keys
    - branch_id references branches(id) ON DELETE SET NULL

  3. Indexes
    - Add indexes on branch_id and created_by for performance
*/

-- ============================================================
-- 1. ADD branch_id TO TABLES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_orders' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE production_orders ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_production_orders_branch ON production_orders(branch_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON stock_movements(branch_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE products ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE warehouses ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_warehouses_branch ON warehouses(branch_id);
  END IF;
END $$;

-- ============================================================
-- 2. ADD created_by TO TABLES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE invoices ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_orders' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE production_orders ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE customers ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE products ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE warehouses ADD COLUMN created_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE branches ADD COLUMN created_by uuid;
  END IF;
END $$;

-- ============================================================
-- 3. ADD metadata (JSONB) TO ALL OPERATIONAL TABLES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE invoices ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE expenses ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE projects ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production_orders' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE production_orders ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE customers ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE products ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE warehouses ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE branches ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- ============================================================
-- 4. CREATE INDEXES FOR CREATED_BY (Audit Trail Queries)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_by ON production_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
