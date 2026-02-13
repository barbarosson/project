/*
  # Optimize RLS Auth Calls - Core Tables

  Replace auth.<function>() with (select auth.<function>()) in RLS policies
  for better performance at scale.

  Tables covered:
  - projects
  - orders  
  - project_milestones
  - order_items
*/

-- ============================================================
-- PROJECTS
-- ============================================================

DROP POLICY IF EXISTS "Projects tenant select" ON projects;
CREATE POLICY "Projects tenant select" ON projects
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Projects tenant insert" ON projects;
CREATE POLICY "Projects tenant insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Projects tenant update" ON projects;
CREATE POLICY "Projects tenant update" ON projects
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Projects tenant delete" ON projects;
CREATE POLICY "Projects tenant delete" ON projects
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- ORDERS
-- ============================================================

DROP POLICY IF EXISTS "Orders tenant select" ON orders;
CREATE POLICY "Orders tenant select" ON orders
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Orders tenant insert" ON orders;
CREATE POLICY "Orders tenant insert" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Orders tenant update" ON orders;
CREATE POLICY "Orders tenant update" ON orders
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Orders tenant delete" ON orders;
CREATE POLICY "Orders tenant delete" ON orders
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- PROJECT_MILESTONES
-- ============================================================

DROP POLICY IF EXISTS "Milestones tenant select" ON project_milestones;
CREATE POLICY "Milestones tenant select" ON project_milestones
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Milestones tenant insert" ON project_milestones;
CREATE POLICY "Milestones tenant insert" ON project_milestones
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Milestones tenant update" ON project_milestones;
CREATE POLICY "Milestones tenant update" ON project_milestones
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Milestones tenant delete" ON project_milestones;
CREATE POLICY "Milestones tenant delete" ON project_milestones
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- ORDER_ITEMS
-- ============================================================

DROP POLICY IF EXISTS "Order items tenant select" ON order_items;
CREATE POLICY "Order items tenant select" ON order_items
  FOR SELECT TO authenticated
  USING (tenant_id = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Order items tenant insert" ON order_items;
CREATE POLICY "Order items tenant insert" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Order items tenant update" ON order_items;
CREATE POLICY "Order items tenant update" ON order_items
  FOR UPDATE TO authenticated
  USING (tenant_id = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

DROP POLICY IF EXISTS "Order items tenant delete" ON order_items;
CREATE POLICY "Order items tenant delete" ON order_items
  FOR DELETE TO authenticated
  USING (tenant_id = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));
