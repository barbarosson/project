/*
  # Add RLS Policies to ai_model_metrics Table

  ## SECURITY FIX
  The ai_model_metrics table has RLS enabled but no policies, making it inaccessible.
  This migration adds proper tenant-based access control policies.

  ## Policies Added
  - SELECT: Users can view metrics for their tenant
  - INSERT: Users can insert metrics for their tenant
  - UPDATE: Users can update metrics for their tenant
  - DELETE: Users can delete metrics for their tenant

  ## Security
  - Tenant isolation enforced
  - Optimized auth function calls with (SELECT auth.uid())
  - Prevents cross-tenant data access

  ## Performance
  - Policies use optimized pattern for minimal overhead
  - Single subquery evaluation per query, not per row
*/

-- Add SELECT policy
CREATE POLICY "Users can view own tenant ai_model_metrics"
  ON ai_model_metrics FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Add INSERT policy
CREATE POLICY "Users can insert own tenant ai_model_metrics"
  ON ai_model_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Add UPDATE policy
CREATE POLICY "Users can update own tenant ai_model_metrics"
  ON ai_model_metrics FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Add DELETE policy
CREATE POLICY "Users can delete own tenant ai_model_metrics"
  ON ai_model_metrics FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'SECURITY FIX: ai_model_metrics RLS Policies';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✓ Added 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '✓ Tenant isolation enforced';
  RAISE NOTICE '✓ Optimized auth function calls';
  RAISE NOTICE '✓ Table is now accessible with proper security';
  RAISE NOTICE '========================================================';
END $$;
