/*
  # Fix RLS Performance and Security Issues

  This migration addresses critical security and performance issues identified by Supabase:

  ## 1. Auth RLS Performance Optimization

  **Problem**: RLS policies re-evaluate `auth.jwt()` for EACH row, causing severe performance degradation at scale.

  **Solution**: Wrap all `auth.jwt()` calls with `(select auth.jwt())` to evaluate once per query instead of per row.

  **Impact**: Dramatically improves query performance for large datasets by evaluating authentication context once.

  ## 2. Remove Duplicate Permissive Policies

  **Problem**: Multiple tables have duplicate policies (one for authenticated users, one for "dev tenant"), creating confusion and potential security gaps.

  **Solution**: Remove redundant "dev tenant" policies. The tenant-based policies already handle all legitimate access patterns.

  **Impact**: Simplifies security model and eliminates policy conflicts.

  ## 3. Fix Function Search Path Security

  **Problem**: Functions `set_ticket_number()` and `generate_ticket_number()` have mutable search paths, creating potential SQL injection vectors.

  **Solution**: Set explicit `search_path` on these functions to prevent search path manipulation attacks.

  **Impact**: Hardens functions against search path attacks.

  ## 4. Tables Updated

  All tables with tenant-based RLS policies:
  - customers
  - products
  - inventory
  - invoices
  - invoice_line_items
  - proposals
  - proposal_line_items
  - campaigns
  - customer_segments
  - stock_movements
  - transactions
  - purchase_invoices
  - purchase_invoice_line_items
  - expenses
  - company_settings
  - support_tickets

  ## 5. Security Notes

  - All policies remain restrictive: tenant-based access only
  - No changes to access control logic, only performance optimization
  - Functions now have secure search paths
  - Removed unused "dev tenant" policies that created redundancy
*/

-- ============================================================================
-- STEP 1: Fix Function Search Paths (Security Issue)
-- ============================================================================

-- Fix generate_ticket_number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_id integer;
  ticket_num text;
BEGIN
  next_id := nextval('support_ticket_seq');
  ticket_num := 'TKT-' || LPAD(next_id::text, 5, '0');
  RETURN ticket_num;
END;
$$;

-- Fix set_ticket_number function
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Drop All Existing Policies (to be recreated with optimized syntax)
-- ============================================================================

-- Drop duplicate "dev tenant" policies
DROP POLICY IF EXISTS "Allow dev tenant access to customers" ON customers;
DROP POLICY IF EXISTS "Allow dev tenant access to products" ON products;
DROP POLICY IF EXISTS "Allow dev tenant access to inventory" ON inventory;
DROP POLICY IF EXISTS "Allow dev tenant access to invoices" ON invoices;
DROP POLICY IF EXISTS "Allow dev tenant access to invoice_line_items" ON invoice_line_items;
DROP POLICY IF EXISTS "Allow dev tenant access to proposals" ON proposals;
DROP POLICY IF EXISTS "Allow dev tenant access to proposal_line_items" ON proposal_line_items;
DROP POLICY IF EXISTS "Allow dev tenant access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow dev tenant access to customer_segments" ON customer_segments;
DROP POLICY IF EXISTS "Allow dev tenant access to stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Allow dev tenant access to transactions" ON transactions;
DROP POLICY IF EXISTS "Allow dev tenant access to purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Allow dev tenant access to purchase invoice line items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Allow dev tenant access to expenses" ON expenses;
DROP POLICY IF EXISTS "Allow dev tenant access to company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow dev tenant access to support tickets" ON support_tickets;

-- Drop existing tenant-based policies
DROP POLICY IF EXISTS "Users can view own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can update own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own tenant customers" ON customers;

DROP POLICY IF EXISTS "Users can view own tenant products" ON products;
DROP POLICY IF EXISTS "Users can insert own tenant products" ON products;
DROP POLICY IF EXISTS "Users can update own tenant products" ON products;
DROP POLICY IF EXISTS "Users can delete own tenant products" ON products;

DROP POLICY IF EXISTS "Users can view own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can insert own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can delete own tenant inventory" ON inventory;

DROP POLICY IF EXISTS "Users can view own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own tenant invoices" ON invoices;

DROP POLICY IF EXISTS "Users can view own tenant invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can update own tenant invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant invoice line items" ON invoice_line_items;

DROP POLICY IF EXISTS "Users can view own tenant proposals" ON proposals;
DROP POLICY IF EXISTS "Users can insert own tenant proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update own tenant proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete own tenant proposals" ON proposals;

DROP POLICY IF EXISTS "Users can view own tenant proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can update own tenant proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant proposal line items" ON proposal_line_items;

DROP POLICY IF EXISTS "Users can view own tenant campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own tenant campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own tenant campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own tenant campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view own tenant customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can insert own tenant customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can update own tenant customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Users can delete own tenant customer segments" ON customer_segments;

DROP POLICY IF EXISTS "Users can view own tenant stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can insert own tenant stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can update own tenant stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can delete own tenant stock movements" ON stock_movements;

DROP POLICY IF EXISTS "Users can view own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own tenant transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own tenant purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can insert own tenant purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoices" ON purchase_invoices;

DROP POLICY IF EXISTS "Users can view own tenant purchase invoice line items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant purchase invoice line items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoice line items" ON purchase_invoice_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoice line items" ON purchase_invoice_line_items;

DROP POLICY IF EXISTS "Users can view own tenant expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own tenant expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own tenant expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own tenant expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view own tenant company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert own tenant company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own tenant company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can delete own tenant company settings" ON company_settings;

DROP POLICY IF EXISTS "Users can view own tenant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create own tenant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own tenant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can delete own tenant tickets" ON support_tickets;

-- ============================================================================
-- STEP 3: Create Optimized RLS Policies with (select auth.jwt())
-- ============================================================================

-- CUSTOMERS Table Policies
CREATE POLICY "Users can view own tenant customers"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant customers"
  ON customers FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- PRODUCTS Table Policies
CREATE POLICY "Users can view own tenant products"
  ON products FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant products"
  ON products FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant products"
  ON products FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- INVENTORY Table Policies
CREATE POLICY "Users can view own tenant inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- INVOICES Table Policies
CREATE POLICY "Users can view own tenant invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- INVOICE_LINE_ITEMS Table Policies
CREATE POLICY "Users can view own tenant invoice line items"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant invoice line items"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant invoice line items"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant invoice line items"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- PROPOSALS Table Policies
CREATE POLICY "Users can view own tenant proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- PROPOSAL_LINE_ITEMS Table Policies
CREATE POLICY "Users can view own tenant proposal line items"
  ON proposal_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant proposal line items"
  ON proposal_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant proposal line items"
  ON proposal_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant proposal line items"
  ON proposal_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- CAMPAIGNS Table Policies
CREATE POLICY "Users can view own tenant campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- CUSTOMER_SEGMENTS Table Policies
CREATE POLICY "Users can view own tenant customer segments"
  ON customer_segments FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant customer segments"
  ON customer_segments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant customer segments"
  ON customer_segments FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant customer segments"
  ON customer_segments FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- STOCK_MOVEMENTS Table Policies
CREATE POLICY "Users can view own tenant stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant stock movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant stock movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- TRANSACTIONS Table Policies
CREATE POLICY "Users can view own tenant transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- PURCHASE_INVOICES Table Policies
CREATE POLICY "Users can view own tenant purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant purchase invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

-- PURCHASE_INVOICE_LINE_ITEMS Table Policies
CREATE POLICY "Users can view own tenant purchase invoice line items"
  ON purchase_invoice_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant purchase invoice line items"
  ON purchase_invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant purchase invoice line items"
  ON purchase_invoice_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant purchase invoice line items"
  ON purchase_invoice_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

-- EXPENSES Table Policies
CREATE POLICY "Users can view own tenant expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

-- COMPANY_SETTINGS Table Policies
CREATE POLICY "Users can view own tenant company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can insert own tenant company settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant company settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant company settings"
  ON company_settings FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

-- SUPPORT_TICKETS Table Policies
CREATE POLICY "Users can view own tenant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can create own tenant tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can update own tenant tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid))
  WITH CHECK (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Users can delete own tenant tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (tenant_id = (select (auth.jwt()->>'tenant_id')::uuid));