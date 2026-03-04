/*
  # purchase_orders & purchase_order_items RLS – profiles.tenant_id

  Uygulama JWT app_metadata kullanmıyor; tenant profiles.tenant_id veya auth.uid().
  Eski app_metadata politikaları kaldırılıp profiles/uid ile yeniden tanımlanıyor.
*/

-- ============================================================================
-- PURCHASE_ORDERS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own tenant purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can view own tenant purchase orders" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own tenant purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can insert own tenant purchase orders" ON public.purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own tenant purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can update own tenant purchase orders" ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own tenant purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can delete own tenant purchase orders" ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

-- ============================================================================
-- PURCHASE_ORDER_ITEMS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own tenant PO items" ON public.purchase_order_items;
CREATE POLICY "Users can view own tenant PO items" ON public.purchase_order_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own tenant PO items" ON public.purchase_order_items;
CREATE POLICY "Users can insert own tenant PO items" ON public.purchase_order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own tenant PO items" ON public.purchase_order_items;
CREATE POLICY "Users can update own tenant PO items" ON public.purchase_order_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own tenant PO items" ON public.purchase_order_items;
CREATE POLICY "Users can delete own tenant PO items" ON public.purchase_order_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()
  );
