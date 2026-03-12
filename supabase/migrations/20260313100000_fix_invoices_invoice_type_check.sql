-- Fix: invoices_invoice_type_check - allow proforma, perakende, konaklama_ver (satış fatura tipleri)
-- Eğer eski migration çalışmadıysa veya constraint farklı isimle oluştuysa bu migration kısıtı günceller.

-- 1) İsimle kaldır (varsa)
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;

-- 2) invoice_type sütununa bağlı başka CHECK varsa onu da kaldır (ADD COLUMN ... CHECK ile oluşan isim farklı olabilir)
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
  END LOOP;
END $$;

-- 3) Yeni CHECK: tüm satış fatura tipleri
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
