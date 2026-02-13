/*
  # Optimize RLS Policies - Tables without tenant_id

  1. Issue
    - Some tables don't have direct tenant_id
    - RLS policies still re-evaluate auth functions
    
  2. Solution
    - Use JOINs to parent tables with tenant_id
    - Wrap auth.uid() with (SELECT auth.uid())
*/

-- ============================================================
-- PRODUCTION BOM ITEMS (no tenant_id, use production_orders)
-- ============================================================

DROP POLICY IF EXISTS "bom_items_select" ON production_bom_items;
CREATE POLICY "bom_items_select"
  ON production_bom_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "bom_items_insert" ON production_bom_items;
CREATE POLICY "bom_items_insert"
  ON production_bom_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "bom_items_update" ON production_bom_items;
CREATE POLICY "bom_items_update"
  ON production_bom_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "bom_items_delete" ON production_bom_items;
CREATE POLICY "bom_items_delete"
  ON production_bom_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_bom_items.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- PRODUCTION LABOR ENTRIES (no tenant_id, use production_orders)
-- ============================================================

DROP POLICY IF EXISTS "labor_entries_select" ON production_labor_entries;
CREATE POLICY "labor_entries_select"
  ON production_labor_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "labor_entries_insert" ON production_labor_entries;
CREATE POLICY "labor_entries_insert"
  ON production_labor_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "labor_entries_update" ON production_labor_entries;
CREATE POLICY "labor_entries_update"
  ON production_labor_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "labor_entries_delete" ON production_labor_entries;
CREATE POLICY "labor_entries_delete"
  ON production_labor_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_labor_entries.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- PRODUCTION QUALITY CHECKS (no tenant_id, use production_orders)
-- ============================================================

DROP POLICY IF EXISTS "qc_checks_select" ON production_quality_checks;
CREATE POLICY "qc_checks_select"
  ON production_quality_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "qc_checks_insert" ON production_quality_checks;
CREATE POLICY "qc_checks_insert"
  ON production_quality_checks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "qc_checks_update" ON production_quality_checks;
CREATE POLICY "qc_checks_update"
  ON production_quality_checks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "qc_checks_delete" ON production_quality_checks;
CREATE POLICY "qc_checks_delete"
  ON production_quality_checks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_orders po
      WHERE po.id = production_quality_checks.production_order_id
      AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- ============================================================
-- WAREHOUSE STOCK (no tenant_id, use warehouses)
-- ============================================================

DROP POLICY IF EXISTS "warehouse_stock_select" ON warehouse_stock;
CREATE POLICY "warehouse_stock_select"
  ON warehouse_stock
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "warehouse_stock_insert" ON warehouse_stock;
CREATE POLICY "warehouse_stock_insert"
  ON warehouse_stock
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "warehouse_stock_update" ON warehouse_stock;
CREATE POLICY "warehouse_stock_update"
  ON warehouse_stock
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "warehouse_stock_delete" ON warehouse_stock;
CREATE POLICY "warehouse_stock_delete"
  ON warehouse_stock
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM warehouses w
      WHERE w.id = warehouse_stock.warehouse_id
      AND w.tenant_id = (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid()))
    )
  );
