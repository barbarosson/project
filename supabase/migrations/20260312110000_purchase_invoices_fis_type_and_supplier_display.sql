-- Fiş tipi ve tedarikçi serbest metin: supplier_id nullable, supplier_display_name ekle, invoice_type'a 'fis' ekle

-- supplier_display_name: Fiş tipinde tedarikçi seçilmeden serbest metin
ALTER TABLE public.purchase_invoices
  ADD COLUMN IF NOT EXISTS supplier_display_name text;

-- Fiş tipinde tedarikçi zorunlu değil
ALTER TABLE public.purchase_invoices
  ALTER COLUMN supplier_id DROP NOT NULL;

-- invoice_type CHECK'e 'fis' ekle (mevcut constraint'i bul, kaldır, yeniden ekle)
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
    'diger',
    'fis'
  ));
