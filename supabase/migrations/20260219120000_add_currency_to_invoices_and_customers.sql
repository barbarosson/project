-- Para birimi: satış faturaları ve cari için (varsayılan şirket tercihi uygulama tarafında)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN currency text DEFAULT 'TRY';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN currency text DEFAULT 'TRY';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);
CREATE INDEX IF NOT EXISTS idx_customers_currency ON customers(currency);
