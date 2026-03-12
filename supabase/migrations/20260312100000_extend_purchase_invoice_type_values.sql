-- Gelen fatura girişi için yeni tip değerleri: fatura_olustur, konaklama_ver_faturasi, maas_odemesi, vergi_odemesi, diger
-- Mevcut CHECK kısıtlamasını kaldırıp genişletilmiş değer listesi ile yeniden ekliyoruz.

DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE t.relname = 'purchase_invoices'
      AND c.contype = 'c'
      AND a.attname = 'invoice_type'
  LOOP
    EXECUTE format('ALTER TABLE public.purchase_invoices DROP CONSTRAINT IF EXISTS %I', conname);
    EXIT;
  END LOOP;
END $$;

ALTER TABLE public.purchase_invoices
  ADD CONSTRAINT purchase_invoices_invoice_type_check
  CHECK (invoice_type IN (
    'purchase',
    'purchase_return',
    'devir',
    'devir_return',
    'fatura_olustur',
    'konaklama_ver_faturasi',
    'maas_odemesi',
    'vergi_odemesi',
    'diger'
  ));
