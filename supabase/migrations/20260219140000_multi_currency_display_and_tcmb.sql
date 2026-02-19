-- Çoklu para birimi: tercihte seçilen dışındaki birimlerde faturada çevrilmiş tutar gösterimi
-- TCMB kur tipi: MBDA, MBDS, MEDA, MEDS. Manuel kur/çevrilmiş tutar override'ı fatura bazında.

-- company_settings: gösterilecek çeviri para birimleri + varsayılan kur tipi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_settings' AND column_name = 'display_currencies'
  ) THEN
    ALTER TABLE public.company_settings ADD COLUMN display_currencies text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_settings' AND column_name = 'default_rate_type'
  ) THEN
    ALTER TABLE public.company_settings ADD COLUMN default_rate_type text DEFAULT 'MBDA';
  END IF;
END $$;

COMMENT ON COLUMN public.company_settings.display_currencies IS 'Faturada çevrilmiş tutar gösterilecek para birimleri (örn. USD, EUR). Boş ise sadece fatura para birimi.';
COMMENT ON COLUMN public.company_settings.default_rate_type IS 'TCMB kur tipi: MBDA (Döviz Alış), MBDS (Döviz Satış), MEDA (Efektif Alış), MEDS (Efektif Satış).';

-- invoices: fatura bazında manuel kur veya manuel çevrilmiş tutar
-- exchange_rate_overrides: { "USD": { "rate": 34.5 } } veya { "USD": { "converted_amount": 1000 } }
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'exchange_rate_overrides'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN exchange_rate_overrides jsonb DEFAULT '{}';
  END IF;
END $$;

COMMENT ON COLUMN public.invoices.exchange_rate_overrides IS 'Para birimi bazında manuel kur (rate) veya manuel çevrilmiş tutar (converted_amount). Örn: {"USD":{"rate":34.5}} veya {"USD":{"converted_amount":500}}.';
