-- Satış faturası satır alanları: indirim, ÖTV, ÖİV, konaklama vergisi, ihraç kodu
ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS otv numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otv_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS oiv numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oiv_type text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS accommodation_tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_code text,
  ADD COLUMN IF NOT EXISTS withholding_reason_code text;

COMMENT ON COLUMN invoice_line_items.discount IS 'İndirim tutarı veya oranı';
COMMENT ON COLUMN invoice_line_items.discount_type IS 'percent | amount';
COMMENT ON COLUMN invoice_line_items.export_code IS 'GIB ihraç kayıtlı kodu (701, 702, 703, 704)';
COMMENT ON COLUMN invoice_line_items.withholding_reason_code IS 'Tevkifat nedeni kodu (9015, 9016 vb.) e-fatura için';
