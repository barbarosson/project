/*
  # purchase_invoices INSERT RLS – WITH CHECK (true) kaldırma

  Linter uyarısı: "Users can insert purchase invoices" politikası WITH CHECK (true)
  kullanıyor; authenticated kullanıcılar herhangi bir tenant adına satır ekleyebiliyor.

  Çözüm: Bu politikayı kaldırıp, sadece kendi tenant'ına (tenant_id = auth.uid())
  satır eklenebilmesini sağlayan güvenli politikayı kullanıyoruz.
*/

-- Güvensiz politika (isim tam linter'ın belirttiği gibi)
DROP POLICY IF EXISTS "Users can insert purchase invoices" ON public.purchase_invoices;

-- Aynı amaçlı diğer olası isimler
DROP POLICY IF EXISTS "Users can insert purchase invoices for own tenant" ON public.purchase_invoices;

-- Güvenli INSERT politikası (zaten varsa tekrar oluşturmak için önce drop)
DROP POLICY IF EXISTS "rls_purchase_invoices_insert" ON public.purchase_invoices;

CREATE POLICY "rls_purchase_invoices_insert"
  ON public.purchase_invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));
