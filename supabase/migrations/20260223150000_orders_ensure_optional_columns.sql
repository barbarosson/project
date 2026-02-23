-- Tek seferde sipariş için opsiyonel kolonları ekle (schema hatası önlenir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_date') THEN
    ALTER TABLE public.orders ADD COLUMN order_date date DEFAULT (CURRENT_DATE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.orders ADD COLUMN exchange_rate numeric(12,6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'exchange_rate_date') THEN
    ALTER TABLE public.orders ADD COLUMN exchange_rate_date date;
  END IF;
END $$;
