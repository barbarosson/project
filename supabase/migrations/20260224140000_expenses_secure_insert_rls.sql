/*
  # expenses tablosu için güvenli INSERT RLS

  Amaç: Kullanıcı sadece kendi harcamalarını ekleyebilsin (WITH CHECK (true) kaldırılıyor).
  Tabloda user_id yok; created_by kolonu aynı mantıkta kullanılıyor.
  İsterseniz user_id kolonu ekleyip ona göre de politika yazabilirsiniz (aşağıda alternatif var).
*/

-- =============================================================================
-- 1. Mevcut güvensiz INSERT politikasını kaldır (isimler projede farklı olabilir)
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "rls_expenses_insert" ON public.expenses;

-- =============================================================================
-- 2. Güvenli INSERT politikası (created_by = auth.uid())
-- =============================================================================
-- Sadece eklenen satırın created_by değeri, o an giriş yapmış kullanıcıya aitse
-- INSERT'e izin verilir. Böylece başka bir kullanıcının ID'si ile veri basılamaz.
CREATE POLICY "Users can insert their own expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =============================================================================
-- 3. (Önerilen) INSERT sırasında created_by'ı otomatik doldur
-- =============================================================================
-- İstemci created_by göndermese bile, trigger ile auth.uid() atanır;
-- politika yine auth.uid() = created_by kontrolü yaptığı için güvenlik korunur.
CREATE OR REPLACE FUNCTION public.set_expense_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_expense_created_by ON public.expenses;
CREATE TRIGGER trigger_set_expense_created_by
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_expense_created_by();

-- =============================================================================
-- ALTERNATİF: user_id kolonu yoksa ekleyip auth.uid() ile ilişkilendirme
-- =============================================================================
-- Aşağıdaki blokları sadece user_id kullanmak isterseniz uygulayın.
-- (expenses tablosunda created_by zaten var; çoğu durumda yukarıdaki politika yeterlidir.)
--
-- Adım 1: Kolonu ekle (mevcut satırlarda NULL kalır veya created_by ile doldurulur)
-- ALTER TABLE public.expenses
--   ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
--
-- Adım 2: Eski satırlarda user_id boşsa created_by ile doldur (isteğe bağlı)
-- UPDATE public.expenses SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
--
-- Adım 3: INSERT sırasında user_id = auth.uid() atayan trigger
-- CREATE OR REPLACE FUNCTION public.set_expense_user_id()
-- RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
-- BEGIN
--   IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
--   RETURN NEW;
-- END; $$;
-- DROP TRIGGER IF EXISTS trigger_set_expense_user_id ON public.expenses;
-- CREATE TRIGGER trigger_set_expense_user_id
--   BEFORE INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_expense_user_id();
--
-- Adım 4: INSERT politikasını user_id ile tanımla
-- DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
-- CREATE POLICY "Users can insert their own expenses"
--   ON public.expenses FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() = user_id);
-- =============================================================================
