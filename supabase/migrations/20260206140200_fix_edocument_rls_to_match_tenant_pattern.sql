/*
  # Fix E-Document RLS Policies - Critical Security Fix

  ## Problem
  E-document tables (edocument_settings, edocuments, edocument_line_items, edocument_activity_log)
  were using `auth.jwt() -> 'app_metadata' ->> 'tenant_id'` which does not match the
  application's tenant pattern. All other tables use `tenant_id = (select auth.uid())`.

  ## Changes
  1. Drop all existing edocument RLS policies
  2. Recreate with `tenant_id::uuid = (select auth.uid())` pattern
  3. This matches how tenant_id is used throughout the rest of the application

  ## Tables Fixed
  - edocument_settings (SELECT, INSERT, UPDATE)
  - edocuments (SELECT, INSERT, UPDATE, DELETE)
  - edocument_line_items (SELECT, INSERT, UPDATE, DELETE)
  - edocument_activity_log (SELECT, INSERT)

  ## Security Notes
  - All policies restricted to authenticated users
  - Tenant isolation enforced via auth.uid()
  - Using (select auth.uid()) subquery for performance
*/

-- Fix edocument_settings policies
DROP POLICY IF EXISTS "Users can view own tenant edocument settings" ON edocument_settings;
DROP POLICY IF EXISTS "Users can insert own tenant edocument settings" ON edocument_settings;
DROP POLICY IF EXISTS "Users can update own tenant edocument settings" ON edocument_settings;

CREATE POLICY "Users can view own tenant edocument settings"
  ON edocument_settings FOR SELECT
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can insert own tenant edocument settings"
  ON edocument_settings FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can update own tenant edocument settings"
  ON edocument_settings FOR UPDATE
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()))
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

-- Fix edocuments policies
DROP POLICY IF EXISTS "Users can view own tenant edocuments" ON edocuments;
DROP POLICY IF EXISTS "Users can insert own tenant edocuments" ON edocuments;
DROP POLICY IF EXISTS "Users can update own tenant edocuments" ON edocuments;
DROP POLICY IF EXISTS "Users can delete own tenant edocuments" ON edocuments;

CREATE POLICY "Users can view own tenant edocuments"
  ON edocuments FOR SELECT
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can insert own tenant edocuments"
  ON edocuments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can update own tenant edocuments"
  ON edocuments FOR UPDATE
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()))
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can delete own tenant edocuments"
  ON edocuments FOR DELETE
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

-- Fix edocument_line_items policies
DROP POLICY IF EXISTS "Users can view own tenant edocument line items" ON edocument_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant edocument line items" ON edocument_line_items;
DROP POLICY IF EXISTS "Users can update own tenant edocument line items" ON edocument_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant edocument line items" ON edocument_line_items;

CREATE POLICY "Users can view own tenant edocument line items"
  ON edocument_line_items FOR SELECT
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can insert own tenant edocument line items"
  ON edocument_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can update own tenant edocument line items"
  ON edocument_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()))
  WITH CHECK (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can delete own tenant edocument line items"
  ON edocument_line_items FOR DELETE
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

-- Fix edocument_activity_log policies
DROP POLICY IF EXISTS "Users can view own tenant edocument activity log" ON edocument_activity_log;
DROP POLICY IF EXISTS "Users can insert own tenant edocument activity log" ON edocument_activity_log;

CREATE POLICY "Users can view own tenant edocument activity log"
  ON edocument_activity_log FOR SELECT
  TO authenticated
  USING (tenant_id::uuid = (select auth.uid()));

CREATE POLICY "Users can insert own tenant edocument activity log"
  ON edocument_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::uuid = (select auth.uid()));
