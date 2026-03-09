-- Link incoming e-documents to imported purchase invoices (alış faturaları)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'edocuments' AND column_name = 'local_purchase_invoice_id'
  ) THEN
    ALTER TABLE edocuments ADD COLUMN local_purchase_invoice_id uuid;
  END IF;
END $$;

-- Optional: add edocument_id to purchase_invoices for reverse lookup (e.g. "E-Faturadan aktarıldı")
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_invoices' AND column_name = 'edocument_id'
  ) THEN
    ALTER TABLE purchase_invoices ADD COLUMN edocument_id uuid REFERENCES edocuments(id) ON DELETE SET NULL;
  END IF;
END $$;
