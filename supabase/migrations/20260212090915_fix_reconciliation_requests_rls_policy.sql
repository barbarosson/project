/*
  # Fix reconciliation_requests RLS policies

  1. Changes
    - Replace JWT claims-based tenant check with auth.uid() pattern
    - Match the pattern used by other tables (invoices, orders, etc.)
    - The old policy used current_setting('request.jwt.claims') which
      doesn't work with standard Supabase auth

  2. Security
    - INSERT: authenticated users can insert rows where tenant_id = auth.uid()
    - SELECT: authenticated users can view rows where tenant_id = auth.uid()
    - UPDATE: authenticated users can update rows where tenant_id = auth.uid()
    - DELETE: authenticated users can delete rows where tenant_id = auth.uid()
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert reconciliation requests for their tenant' AND polrelid = 'reconciliation_requests'::regclass) THEN
    DROP POLICY "Users can insert reconciliation requests for their tenant" ON reconciliation_requests;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view reconciliation requests for their tenant' AND polrelid = 'reconciliation_requests'::regclass) THEN
    DROP POLICY "Users can view reconciliation requests for their tenant" ON reconciliation_requests;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update reconciliation requests for their tenant' AND polrelid = 'reconciliation_requests'::regclass) THEN
    DROP POLICY "Users can update reconciliation requests for their tenant" ON reconciliation_requests;
  END IF;
END $$;

CREATE POLICY "Authenticated users can insert reconciliation requests"
  ON reconciliation_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Authenticated users can view own reconciliation requests"
  ON reconciliation_requests
  FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Authenticated users can update own reconciliation requests"
  ON reconciliation_requests
  FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Authenticated users can delete own reconciliation requests"
  ON reconciliation_requests
  FOR DELETE
  TO authenticated
  USING (tenant_id = auth.uid());