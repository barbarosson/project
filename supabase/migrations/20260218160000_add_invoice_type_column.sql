-- Fatura tipi: satış/alış faturalarını alt tiplere ayırır.
-- invoices: sale, sale_return, devir, devir_return
-- purchase_invoices: purchase, purchase_return, devir, devir_return

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN invoice_type text DEFAULT 'sale'
      CHECK (invoice_type IN ('sale', 'sale_return', 'devir', 'devir_return'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE public.purchase_invoices ADD COLUMN invoice_type text DEFAULT 'purchase'
      CHECK (invoice_type IN ('purchase', 'purchase_return', 'devir', 'devir_return'));
  END IF;
END $$;

-- Mevcut devir faturalarını otomatik etiketle
UPDATE invoices SET invoice_type = 'devir'       WHERE invoice_number LIKE 'DEV-%'      AND invoice_type = 'sale';
UPDATE invoices SET invoice_type = 'devir_return' WHERE invoice_number LIKE 'IADE-DEV-%' AND invoice_type = 'sale';

CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_type ON purchase_invoices(invoice_type);
