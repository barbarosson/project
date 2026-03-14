-- Kullaniciyi (auth + profil + iliskili kayitlar) tamamen siler.
-- Supabase SQL Editor'de calistirin.
-- v_user_id degerini silinecek kullanici uuid'si ile degistirin.

DO $$
DECLARE
  v_user_id uuid := 'ab3ddd4d-e46a-4a47-849b-a9319081d4bd';
BEGIN
  -- 1) user_id ile iliskili tablolar (FK hata vermemesi icin once bunlar)
  DELETE FROM public.user_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.activity_log WHERE user_id = v_user_id;
  DELETE FROM public.admin_logs WHERE user_id = v_user_id;

  -- 2) Tenant silinince customers CASCADE silinir; bu tenant'in musterilerine referans veren kayitlari once sil (tenant_id yerine customer/tenant uzerinden)
  DELETE FROM public.proposal_line_items WHERE proposal_id IN (SELECT p.id FROM public.proposals p INNER JOIN public.customers c ON c.id = p.customer_id WHERE c.tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = v_user_id));
  DELETE FROM public.proposals WHERE customer_id IN (SELECT id FROM public.customers WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = v_user_id));
  DELETE FROM public.purchase_invoice_line_items WHERE purchase_invoice_id IN (SELECT pi.id FROM public.purchase_invoices pi INNER JOIN public.customers c ON c.id = pi.supplier_id WHERE c.tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = v_user_id));
  DELETE FROM public.purchase_invoices WHERE supplier_id IN (SELECT id FROM public.customers WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = v_user_id));

  -- 3) Tenant ayarlari ve tenant
  DELETE FROM public.company_settings WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = v_user_id);
  DELETE FROM public.tenants WHERE owner_id = v_user_id;

  -- 4) Profil (auth.users'dan once silinmeli; profiles.id -> auth.users.id referans var)
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- 5) Auth kullanici kaydi
  DELETE FROM auth.users WHERE id = v_user_id;

  RAISE NOTICE 'Kullanici silindi: %', v_user_id;
END $$;
