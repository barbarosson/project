-- Ensure exchange_rate and exchange_rate_date exist on orders (fixes "Could not find the 'exchange_rate' column of 'orders' in the schema cache")
-- PostgREST will refresh its schema cache when this migration is applied.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.orders ADD COLUMN exchange_rate numeric(12,6);
    COMMENT ON COLUMN public.orders.exchange_rate IS '1 unit of order currency = this many TRY (TCMB rate when currency <> TRY)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'exchange_rate_date') THEN
    ALTER TABLE public.orders ADD COLUMN exchange_rate_date date;
    COMMENT ON COLUMN public.orders.exchange_rate_date IS 'Date of the exchange rate used';
  END IF;
END $$;
