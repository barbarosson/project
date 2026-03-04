/*
  # staff RLS – profiles.tenant_id

  Uygulama tenant'ı profiles.tenant_id veya auth.uid() ile alıyor; JWT'de tenant_id yok.
  staff.tenant_id text olduğu için profiles.tenant_id::text ve auth.uid()::text ile karşılaştırıyoruz.
*/

DROP POLICY IF EXISTS "Users can view own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can insert own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can update own tenant staff" ON public.staff;
DROP POLICY IF EXISTS "Users can delete own tenant staff" ON public.staff;

CREATE POLICY "Users can view own tenant staff" ON public.staff
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()::text
  );

CREATE POLICY "Users can insert own tenant staff" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()::text
  );

CREATE POLICY "Users can update own tenant staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()::text
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()::text
  );

CREATE POLICY "Users can delete own tenant staff" ON public.staff
  FOR DELETE TO authenticated
  USING (
    tenant_id = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    OR tenant_id = auth.uid()::text
  );
