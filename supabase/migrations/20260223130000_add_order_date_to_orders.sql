-- Sipariş tarihi: işlem tarihi (kur tarihi bu tarihten beslenir)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_date date DEFAULT (CURRENT_DATE);

COMMENT ON COLUMN public.orders.order_date IS 'Sipariş tarihi (işlem tarihi); kur tarihi bu tarihten alınır';
