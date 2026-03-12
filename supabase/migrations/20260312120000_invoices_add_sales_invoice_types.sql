-- Satış faturası tipleri: proforma, perakende, konaklama_ver (mevcut sale, sale_return, devir, devir_return korunur)

DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE t.relname = 'invoices'
      AND c.contype = 'c'
      AND a.attname = 'invoice_type'
  LOOP
    EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS %I', conname);
    EXIT;
  END LOOP;
END $$;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_invoice_type_check
  CHECK (invoice_type IN (
    'sale',
    'sale_return',
    'devir',
    'devir_return',
    'proforma',
    'perakende',
    'konaklama_ver'
  ));
