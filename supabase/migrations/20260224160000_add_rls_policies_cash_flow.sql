/*
  # public.cash_flow – RLS politikası yok uyarısı

  Tabloda RLS açık ama politika tanımlı değil; bu yüzden hiçbir rol satır
  göremez/değiştiremez. Tenant bazlı SELECT, INSERT, UPDATE, DELETE politikaları ekleniyor.

  Gereksinim: public.cash_flow tablosunda tenant_id kolonu olmalı.
  Kolon yoksa önce ekleyin: ALTER TABLE public.cash_flow ADD COLUMN tenant_id uuid;
*/

-- Sadece tablo ve tenant_id kolonu mevcutsa politika oluştur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cash_flow' AND column_name = 'tenant_id'
  ) THEN
    -- SELECT: kendi tenant'ının satırları
    EXECUTE 'CREATE POLICY "rls_cash_flow_select"
      ON public.cash_flow FOR SELECT TO authenticated
      USING (tenant_id = (SELECT auth.uid()))';

    -- INSERT: sadece kendi tenant_id ile ekleme
    EXECUTE 'CREATE POLICY "rls_cash_flow_insert"
      ON public.cash_flow FOR INSERT TO authenticated
      WITH CHECK (tenant_id = (SELECT auth.uid()))';

    -- UPDATE: kendi tenant'ının satırları
    EXECUTE 'CREATE POLICY "rls_cash_flow_update"
      ON public.cash_flow FOR UPDATE TO authenticated
      USING (tenant_id = (SELECT auth.uid()))
      WITH CHECK (tenant_id = (SELECT auth.uid()))';

    -- DELETE: kendi tenant'ının satırları
    EXECUTE 'CREATE POLICY "rls_cash_flow_delete"
      ON public.cash_flow FOR DELETE TO authenticated
      USING (tenant_id = (SELECT auth.uid()))';
  END IF;
END
$$;
