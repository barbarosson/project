/*
  # Optimize RLS Policies - Auth Function Calls Phase 2

  ## Performance Enhancement - Continuation
  
  Optimizes remaining high-traffic tables with tenant isolation
*/

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view campaigns in their tenant" ON public.campaigns;
CREATE POLICY "Users can view campaigns in their tenant" ON public.campaigns
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert campaigns in their tenant" ON public.campaigns;
CREATE POLICY "Users can insert campaigns in their tenant" ON public.campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update campaigns in their tenant" ON public.campaigns;
CREATE POLICY "Users can update campaigns in their tenant" ON public.campaigns
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete campaigns in their tenant" ON public.campaigns;
CREATE POLICY "Users can delete campaigns in their tenant" ON public.campaigns
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- STOCK_MOVEMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view stock_movements in their tenant" ON public.stock_movements;
CREATE POLICY "Users can view stock_movements in their tenant" ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert stock_movements in their tenant" ON public.stock_movements;
CREATE POLICY "Users can insert stock_movements in their tenant" ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update stock_movements in their tenant" ON public.stock_movements;
CREATE POLICY "Users can update stock_movements in their tenant" ON public.stock_movements
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete stock_movements in their tenant" ON public.stock_movements;
CREATE POLICY "Users can delete stock_movements in their tenant" ON public.stock_movements
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PROPOSALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can view proposals in their tenant" ON public.proposals
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can insert proposals in their tenant" ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can update proposals in their tenant" ON public.proposals
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can delete proposals in their tenant" ON public.proposals
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view projects in their tenant" ON public.projects;
CREATE POLICY "Users can view projects in their tenant" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert projects in their tenant" ON public.projects;
CREATE POLICY "Users can insert projects in their tenant" ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update projects in their tenant" ON public.projects;
CREATE POLICY "Users can update projects in their tenant" ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete projects in their tenant" ON public.projects;
CREATE POLICY "Users can delete projects in their tenant" ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PRODUCTION_ORDERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view production_orders in their tenant" ON public.production_orders;
CREATE POLICY "Users can view production_orders in their tenant" ON public.production_orders
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert production_orders in their tenant" ON public.production_orders;
CREATE POLICY "Users can insert production_orders in their tenant" ON public.production_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update production_orders in their tenant" ON public.production_orders;
CREATE POLICY "Users can update production_orders in their tenant" ON public.production_orders
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete production_orders in their tenant" ON public.production_orders;
CREATE POLICY "Users can delete production_orders in their tenant" ON public.production_orders
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- WAREHOUSES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view warehouses in their tenant" ON public.warehouses;
CREATE POLICY "Users can view warehouses in their tenant" ON public.warehouses
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert warehouses in their tenant" ON public.warehouses;
CREATE POLICY "Users can insert warehouses in their tenant" ON public.warehouses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update warehouses in their tenant" ON public.warehouses;
CREATE POLICY "Users can update warehouses in their tenant" ON public.warehouses
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete warehouses in their tenant" ON public.warehouses;
CREATE POLICY "Users can delete warehouses in their tenant" ON public.warehouses
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- BRANCHES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view branches in their tenant" ON public.branches;
CREATE POLICY "Users can view branches in their tenant" ON public.branches
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert branches in their tenant" ON public.branches;
CREATE POLICY "Users can insert branches in their tenant" ON public.branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update branches in their tenant" ON public.branches;
CREATE POLICY "Users can update branches in their tenant" ON public.branches
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete branches in their tenant" ON public.branches;
CREATE POLICY "Users can delete branches in their tenant" ON public.branches
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS AUTH OPTIMIZATION PHASE 2 COMPLETE';
  RAISE NOTICE 'Optimized: campaigns, stock_movements, proposals, projects,';
  RAISE NOTICE 'production_orders, warehouses, branches';
END $$;
