/*
  # Fix orders RLS and add exchange rate for foreign currency

  1. Orders RLS
    - Allow INSERT/SELECT/UPDATE/DELETE when tenant_id matches either:
      - tenants.id for tenants where owner_id = current user, OR
      - profiles.tenant_id for current user's profile
    - Fixes "new row violates row-level security policy" when creating manual orders.

  2. Order items RLS
    - Same logic for order_items so inserts succeed with orders.

  3. Exchange rate on orders
    - Add column exchange_rate (numeric) and exchange_rate_date (date) to orders
      for storing conversion rate when currency != TRY.
*/

-- ============================================================================
-- ORDERS: RLS to allow tenant from tenants OR profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view orders in their tenant" ON public.orders;
CREATE POLICY "Users can view orders in their tenant" ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert orders in their tenant" ON public.orders;
CREATE POLICY "Users can insert orders in their tenant" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update orders in their tenant" ON public.orders;
CREATE POLICY "Users can update orders in their tenant" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete orders in their tenant" ON public.orders;
CREATE POLICY "Users can delete orders in their tenant" ON public.orders
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================================
-- ORDER_ITEMS: RLS to allow tenant from tenants OR profiles
-- ============================================================================
DROP POLICY IF EXISTS "Order items tenant select" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can view order_items in their tenant" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Order items tenant insert" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can insert order_items in their tenant" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Order items tenant update" ON public.order_items;
DROP POLICY IF EXISTS "Users can update order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can update order_items in their tenant" ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Order items tenant delete" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can delete order_items in their tenant" ON public.order_items
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- ============================================================================
-- ORDERS: Add exchange rate columns for foreign currency
-- ============================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS exchange_rate_date date;

COMMENT ON COLUMN public.orders.exchange_rate IS '1 unit of order currency = this many TRY (TCMB rate when currency <> TRY)';
COMMENT ON COLUMN public.orders.exchange_rate_date IS 'Date of the exchange rate used';
