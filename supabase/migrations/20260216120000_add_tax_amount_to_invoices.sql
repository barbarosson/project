-- Add tax_amount to invoices if missing (for schema cache / devir invoice compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN tax_amount numeric(15,2) DEFAULT 0;
  END IF;
END $$;
