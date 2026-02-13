/*
  # Create Multi-Warehouse Stock Management System

  Extends the existing single-location inventory into a full multi-warehouse
  system with location tracking, inter-warehouse transfers, real-time stock
  per warehouse, and inventory valuation analytics.

  1. New Tables
    - `warehouses` - Physical warehouse/location master data
      - `id` (uuid, PK)
      - `tenant_id` (uuid, NOT NULL)
      - `name` (text, NOT NULL)
      - `code` (text, short identifier)
      - `location` (text, address or area)
      - `is_main` (boolean, marks the primary warehouse)
      - `is_active` (boolean)
      - `capacity_description` (text, optional notes about capacity)
      - `manager_name` (text)
      - `notes` (text)

    - `warehouse_stock` - Per-warehouse stock levels for each product
      - `id` (uuid, PK)
      - `warehouse_id` (uuid, FK to warehouses)
      - `product_id` (uuid, FK to products)
      - `quantity` (numeric, current stock at this warehouse)
      - `reserved_quantity` (numeric, reserved for orders/production)
      - `last_counted_at` (timestamptz, last physical count)

    - `warehouse_transfers` - Inter-warehouse stock movement records
      - `id` (uuid, PK)
      - `tenant_id` (uuid, NOT NULL)
      - `transfer_number` (text, auto-generated)
      - `from_warehouse_id` (uuid, FK)
      - `to_warehouse_id` (uuid, FK)
      - `product_id` (uuid, FK to products)
      - `quantity` (numeric, amount transferred)
      - `status` (text: pending / in_transit / completed / cancelled)
      - `initiated_by` (text)
      - `notes` (text)

  2. Altered Tables
    - `stock_movements` - Added `warehouse_id` column for location tracking

  3. Views
    - `warehouse_inventory_summary` - Real-time stock per warehouse with valuation

  4. Security
    - RLS enabled on all new tables
    - Tenant-isolated SELECT, INSERT, UPDATE, DELETE policies
*/

-- ============================================================
-- 1. WAREHOUSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  code text DEFAULT '',
  location text DEFAULT '',
  is_main boolean DEFAULT false,
  is_active boolean DEFAULT true,
  capacity_description text DEFAULT '',
  manager_name text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_main ON warehouses(is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active) WHERE is_active = true;

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_select"
  ON warehouses FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "warehouses_insert"
  ON warehouses FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "warehouses_update"
  ON warehouses FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "warehouses_delete"
  ON warehouses FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 2. WAREHOUSE STOCK LEVELS (per product per warehouse)
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity numeric NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  last_counted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_stock_unique UNIQUE (warehouse_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product ON warehouse_stock(product_id);

ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouse_stock_select"
  ON warehouse_stock FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "warehouse_stock_insert"
  ON warehouse_stock FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "warehouse_stock_update"
  ON warehouse_stock FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

CREATE POLICY "warehouse_stock_delete"
  ON warehouse_stock FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
    )
  );

-- ============================================================
-- 3. WAREHOUSE TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  transfer_number text DEFAULT '',
  from_warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  initiated_by text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT transfer_different_warehouses CHECK (from_warehouse_id <> to_warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_tenant ON warehouse_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON warehouse_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON warehouse_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_product ON warehouse_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created ON warehouse_transfers(created_at DESC);

ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_select"
  ON warehouse_transfers FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "transfers_insert"
  ON warehouse_transfers FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "transfers_update"
  ON warehouse_transfers FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "transfers_delete"
  ON warehouse_transfers FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 4. ADD WAREHOUSE_ID TO STOCK_MOVEMENTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_movements' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);

-- ============================================================
-- 5. WAREHOUSE INVENTORY SUMMARY VIEW
-- ============================================================
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
  p.unit,
  p.critical_level,
  p.purchase_price,
  p.sale_price,
  p.average_cost,
  COALESCE(ws.quantity, 0) AS warehouse_quantity,
  COALESCE(ws.reserved_quantity, 0) AS reserved_quantity,
  COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0) AS available_quantity,
  COALESCE(ws.quantity, 0) * COALESCE(p.average_cost, 0) AS stock_value,
  ws.last_counted_at,
  CASE
    WHEN COALESCE(ws.quantity, 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(ws.quantity, 0) <= COALESCE(p.critical_level, 10) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM warehouses w
CROSS JOIN products p
LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id AND ws.product_id = p.id
WHERE w.is_active = true
  AND p.status = 'active'
  AND w.tenant_id = p.tenant_id;
