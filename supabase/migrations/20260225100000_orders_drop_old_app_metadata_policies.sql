/*
  # Eski orders/order_items RLS politikalarını kaldır

  Uygulama JWT app_metadata.tenant_id kullanmıyor; tenant_id = auth.uid() veya
  profiles.tenant_id / tenants.id ile çalışıyor. Eski "Orders tenant select" vb.
  politikalar app_metadata'a baktığı için hiç satır dönmüyordu. Bu migration
  sadece o eski politikaları DROP eder; "Users can view/insert/update/delete
  orders in their tenant" politikaları (20260223160000 / 20260224180000) kalır.
*/

-- ORDERS: app_metadata kullanan eski politikaları kaldır
DROP POLICY IF EXISTS "Orders tenant select" ON public.orders;
DROP POLICY IF EXISTS "Orders tenant insert" ON public.orders;
DROP POLICY IF EXISTS "Orders tenant update" ON public.orders;
DROP POLICY IF EXISTS "Orders tenant delete" ON public.orders;

-- ORDER_ITEMS: app_metadata kullanan eski politikaları kaldır
DROP POLICY IF EXISTS "Order items tenant select" ON public.order_items;
DROP POLICY IF EXISTS "Order items tenant insert" ON public.order_items;
DROP POLICY IF EXISTS "Order items tenant update" ON public.order_items;
DROP POLICY IF EXISTS "Order items tenant delete" ON public.order_items;
