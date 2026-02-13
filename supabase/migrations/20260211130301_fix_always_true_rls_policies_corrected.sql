/*
  # Fix Always True RLS Policies - Corrected

  ## Security Enhancement
  
  Fixes tables with USING (true) or WITH CHECK (true) that bypass security
*/

-- ============================================================================
-- AI PRODUCTION SUGGESTIONS - Add tenant isolation
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated users" ON public.ai_production_suggestions;

CREATE POLICY "Users can view suggestions in their tenant" ON public.ai_production_suggestions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert suggestions in their tenant" ON public.ai_production_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update suggestions in their tenant" ON public.ai_production_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete suggestions in their tenant" ON public.ai_production_suggestions
  FOR DELETE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- EINVOICE DETAILS - Add tenant isolation
-- ============================================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_details;

CREATE POLICY "Users can view einvoice_details in their tenant" ON public.einvoice_details
  FOR SELECT
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert einvoice_details in their tenant" ON public.einvoice_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update einvoice_details in their tenant" ON public.einvoice_details
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete einvoice_details in their tenant" ON public.einvoice_details
  FOR DELETE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- EINVOICE LOGS - Add tenant isolation via einvoice_details
-- ============================================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_logs;

CREATE POLICY "Users can view einvoice_logs in their tenant" ON public.einvoice_logs
  FOR SELECT
  TO authenticated
  USING (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert einvoice_logs in their tenant" ON public.einvoice_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================================
-- EINVOICE QUEUE - Add tenant isolation via einvoice_details
-- ============================================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_queue;

CREATE POLICY "Users can view einvoice_queue in their tenant" ON public.einvoice_queue
  FOR SELECT
  TO authenticated
  USING (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert einvoice_queue in their tenant" ON public.einvoice_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can update einvoice_queue in their tenant" ON public.einvoice_queue
  FOR UPDATE
  TO authenticated
  USING (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete einvoice_queue in their tenant" ON public.einvoice_queue
  FOR DELETE
  TO authenticated
  USING (
    einvoice_detail_id IN (
      SELECT id FROM public.einvoice_details
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================================
-- PRODUCTION RECIPES - Add tenant isolation
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated users" ON public.production_recipes;

CREATE POLICY "Users can view recipes in their tenant" ON public.production_recipes
  FOR SELECT
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert recipes in their tenant" ON public.production_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update recipes in their tenant" ON public.production_recipes
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete recipes in their tenant" ON public.production_recipes
  FOR DELETE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PRODUCTION RECIPE ITEMS - Add tenant isolation via recipe
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated users" ON public.production_recipe_items;

CREATE POLICY "Users can view recipe items in their tenant" ON public.production_recipe_items
  FOR SELECT
  TO authenticated
  USING (
    recipe_id IN (
      SELECT id FROM public.production_recipes
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert recipe items in their tenant" ON public.production_recipe_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.production_recipes
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can update recipe items in their tenant" ON public.production_recipe_items
  FOR UPDATE
  TO authenticated
  USING (
    recipe_id IN (
      SELECT id FROM public.production_recipes
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.production_recipes
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete recipe items in their tenant" ON public.production_recipe_items
  FOR DELETE
  TO authenticated
  USING (
    recipe_id IN (
      SELECT id FROM public.production_recipes
      WHERE tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

-- ============================================================================
-- TAX RATES - Add tenant isolation
-- ============================================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.tax_rates;

CREATE POLICY "Users can view tax_rates in their tenant" ON public.tax_rates
  FOR SELECT
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert tax_rates in their tenant" ON public.tax_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update tax_rates in their tenant" ON public.tax_rates
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete tax_rates in their tenant" ON public.tax_rates
  FOR DELETE
  TO authenticated
  USING (
    tenant_id::text IN (
      SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'ALWAYS TRUE RLS POLICIES FIXED';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Fixed critical security vulnerabilities:';
  RAISE NOTICE '- AI production suggestions';
  RAISE NOTICE '- E-Invoice system (details, logs, queue)';
  RAISE NOTICE '- Production recipes and items';
  RAISE NOTICE '- Tax rates';
  RAISE NOTICE 'All now have proper tenant isolation';
  RAISE NOTICE '========================================================';
END $$;
