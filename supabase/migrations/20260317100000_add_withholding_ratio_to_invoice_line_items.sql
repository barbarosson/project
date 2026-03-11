-- Tevkifat kodu (601, 602, … 627) satır bazında saklanır; e-fatura UBL TaxTypeCode olarak kullanılır.
ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS withholding_ratio text;

COMMENT ON COLUMN invoice_line_items.withholding_ratio IS 'GIB tevkifat kodu (601-627) veya oran (örn. 9/10). E-fatura gönderiminde WithholdingTaxTypeCode olarak kullanılır.';
