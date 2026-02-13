/*
  # Fix Critical "Always True" RLS Policies (Corrected)

  This migration fixes the most critical RLS policies that have unrestricted access.
  
  ## Changes
  - Add comments to flag development-only policies
  - Fix einvoice and tax_rates policies with proper tenant isolation
*/

-- Add comments to flag "Allow public" policies for production review
DO $$
BEGIN
  EXECUTE 'COMMENT ON POLICY "Allow public to view customers" ON public.customers IS 
    ''SECURITY WARNING: This policy allows unrestricted access. Review before production deployment.''';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'COMMENT ON POLICY "Allow public to insert customers" ON public.customers IS 
    ''SECURITY WARNING: This policy allows unrestricted access. Review before production deployment.''';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'COMMENT ON POLICY "Allow public to update customers" ON public.customers IS 
    ''SECURITY WARNING: This policy allows unrestricted access. Review before production deployment.''';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'COMMENT ON POLICY "Allow public to delete customers" ON public.customers IS 
    ''SECURITY WARNING: This policy allows unrestricted access. Review before production deployment.''';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Fix einvoice_details (has tenant_id)
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_details;

CREATE POLICY "Users can manage own tenant einvoice details" ON public.einvoice_details
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));

-- Fix einvoice_logs (no tenant_id, use einvoice_detail_id join)
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_logs;

CREATE POLICY "Users can manage own tenant einvoice logs" ON public.einvoice_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.einvoice_details
      WHERE einvoice_details.id = einvoice_logs.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.einvoice_details
      WHERE einvoice_details.id = einvoice_logs.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  );

-- Fix einvoice_queue (no tenant_id, use einvoice_detail_id join)
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_queue;

CREATE POLICY "Users can manage own tenant einvoice queue" ON public.einvoice_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.einvoice_details
      WHERE einvoice_details.id = einvoice_queue.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.einvoice_details
      WHERE einvoice_details.id = einvoice_queue.einvoice_detail_id
      AND einvoice_details.tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid)
    )
  );

-- Fix tax_rates (has tenant_id)
DROP POLICY IF EXISTS "Tenant isolation" ON public.tax_rates;

CREATE POLICY "Users can manage own tenant tax rates" ON public.tax_rates
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (SELECT (auth.jwt()->>'tenant_id')::uuid));