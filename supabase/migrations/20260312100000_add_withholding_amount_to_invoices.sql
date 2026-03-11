-- Add tevkifat (withholding) amount to sales invoices.
-- Toplam = KDV dahil; Tevkifat = kesinti; Ödenecek = Toplam - Tevkifat.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS withholding_amount numeric(15, 2) DEFAULT 0;

COMMENT ON COLUMN public.invoices.withholding_amount IS 'Tevkifat tutarı (₺). Ödenecek tutar = amount - withholding_amount.';
