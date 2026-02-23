/*
  # Orders RLS: allow tenant_id = current user id

  Uygulama tenant_id olarak kullanıcı id (auth.uid()) gönderiyor.
  Bu migration, tenant_id = auth.uid() (text) olduğunda da INSERT/SELECT/UPDATE/DELETE'e izin verir.
  "new row violates row-level security policy" hatasını giderir.
*/

-- ORDERS
DROP POLICY IF EXISTS "Users can view orders in their tenant" ON public.orders;
CREATE POLICY "Users can view orders in their tenant" ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert orders in their tenant" ON public.orders;
CREATE POLICY "Users can insert orders in their tenant" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update orders in their tenant" ON public.orders;
CREATE POLICY "Users can update orders in their tenant" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete orders in their tenant" ON public.orders;
CREATE POLICY "Users can delete orders in their tenant" ON public.orders
  FOR DELETE TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Users can view order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can view order_items in their tenant" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can insert order_items in their tenant" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can update order_items in their tenant" ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete order_items in their tenant" ON public.order_items;
CREATE POLICY "Users can delete order_items in their tenant" ON public.order_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = (SELECT auth.uid()::text)
    OR tenant_id IN (SELECT id::text FROM public.tenants WHERE owner_id = (SELECT auth.uid()))
    OR tenant_id IN (SELECT tenant_id::text FROM public.profiles WHERE id = (SELECT auth.uid()))
  );
