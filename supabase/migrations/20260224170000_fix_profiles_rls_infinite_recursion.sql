/*
  # profiles RLS infinite recursion düzeltmesi

  Sorun: "Admins can view all profiles" ve "Admin can update any profile"
  politikaları, admin kontrolü için SELECT ... FROM profiles yapıyordu.
  Bu da aynı tabloda RLS'i tekrar tetikleyip "infinite recursion detected
  in policy for relation profiles" hatasına yol açıyordu.

  Çözüm: Admin kontrolünü SECURITY DEFINER bir fonksiyonla yapıyoruz.
  Fonksiyon profiles tablosunu RLS atlayarak okur; politika içinde
  artık profiles'a SELECT atılmıyor.
*/

-- 1) Mevcut kullanıcının profil rolünü döndüren fonksiyon (RLS bypass)
CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_profile_role() IS
  'Returns current user profile role. SECURITY DEFINER to avoid RLS recursion when used in profiles policies.';

GRANT EXECUTE ON FUNCTION public.get_my_profile_role() TO authenticated;

-- 2) Recursive politikaları kaldır ve fonksiyon kullanan versiyonlarla değiştir
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

-- Admin tüm profilleri görebilir (recursion yok: get_my_profile_role() RLS atlar)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_my_profile_role()) IN ('admin', 'super_admin')
  );

-- Admin herhangi bir profili güncelleyebilir
CREATE POLICY "Admin can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.get_my_profile_role()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT public.get_my_profile_role()) IN ('admin', 'super_admin')
  );
