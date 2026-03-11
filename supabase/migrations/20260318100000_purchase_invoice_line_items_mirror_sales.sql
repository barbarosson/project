-- Alış faturası satırlarını satış faturası yapısıyla birebir uyumlu yapmak için ek sütunlar.
-- purchase_invoice_line_items: satıştaki invoice_line_items ile aynı alan seti.

-- product_name (ürün/hizmet adı; description'dan ayrı tutulabilir)
ALTER TABLE purchase_invoice_line_items
  ADD COLUMN IF NOT EXISTS product_name text;

-- birim (Adet, Kg, m, m², Saat, Gün)
ALTER TABLE purchase_invoice_line_items
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'adet';

-- satışla aynı ek alanlar
ALTER TABLE purchase_invoice_line_items
  ADD COLUMN IF NOT EXISTS line_total numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount numeric(12,2) DEFAULT 0;

ALTER TABLE purchase_invoice_line_items
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS otv numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otv_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS oiv numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oiv_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS accommodation_tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_code text,
  ADD COLUMN IF NOT EXISTS withholding_ratio text,
  ADD COLUMN IF NOT EXISTS withholding_reason_code text;

-- purchase_invoices: tevkifat tutarı ve para birimi (satışla uyum)
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS withholding_amount numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN purchase_invoice_line_items.product_name IS 'Ürün/hizmet adı (satış faturasıyla aynı)';
COMMENT ON COLUMN purchase_invoice_line_items.unit IS 'Birim: adet, kg, m, m2, saat, gün';
COMMENT ON COLUMN purchase_invoices.withholding_amount IS 'Tevkifat toplamı (₺)';
COMMENT ON COLUMN purchase_invoices.currency IS 'Para birimi kodu (TRY, USD, EUR)';
