/*
  # RLS "Always True" ve Function Search Path Güvenlik Düzeltmeleri

  ## 1. RLS Policy Always True (11 tablo)
  UPDATE, INSERT ve DELETE politikaları "true" olan tablolar kısıtlanıyor.
  Sadece ilgili satırın tenant'ı (tenant_id = auth.uid()) işlem yapabilecek.

  ## 2. Function Search Path Mutable
  public.generate_ticket_number ve public.set_ticket_number fonksiyonlarına
  SET search_path = public ekleniyor (search path enjeksiyonuna karşı).

  ## 3. Genel Öneri ve Leaked Password Protection
  Açıklama migration sonunda yorum olarak ve SECURITY_AND_LEAKED_PASSWORD_NOTES.md'de.
*/

-- =============================================================================
-- BÖLÜM 1: RLS POLİTİKALARI – DROP (tüm varyantlar) + CREATE (tenant kısıtlı)
-- =============================================================================
-- Koşul: tenant_id = (SELECT auth.uid()) — sadece kendi tenant verisine erişim.
-- Not: Uygulamanız JWT app_metadata ile tenant_id kullanıyorsa,
--      (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid ile değiştirebilirsiniz.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- campaigns
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert own tenant campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own tenant campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own tenant campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public access to dev tenant campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Optimized read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Optimized insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Optimized update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Optimized delete campaigns" ON public.campaigns;

CREATE POLICY "rls_campaigns_select"
  ON public.campaigns FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_campaigns_insert"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_campaigns_update"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_campaigns_delete"
  ON public.campaigns FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- company_settings
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert own tenant company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update own tenant company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete own tenant company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Public access to dev tenant company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Tenant access to company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Tenant insert to company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Tenant update to company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Tenant delete from company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated manage company_settings" ON public.company_settings;

CREATE POLICY "rls_company_settings_select"
  ON public.company_settings FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_company_settings_insert"
  ON public.company_settings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_company_settings_update"
  ON public.company_settings FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_company_settings_delete"
  ON public.company_settings FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- customer_segments
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can insert own tenant customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can update own tenant customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can delete own tenant customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can select own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can insert own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can update own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can delete own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Authenticated users can view customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Anyone can view customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Anyone can insert customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Anyone can update customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Anyone can delete customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Allow authenticated users to read own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Allow authenticated users to insert own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Allow authenticated users to update own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Allow authenticated users to delete own tenant customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Authenticated manage customer_segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Optimized manage customer_segments" ON public.customer_segments;

CREATE POLICY "rls_customer_segments_select"
  ON public.customer_segments FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_customer_segments_insert"
  ON public.customer_segments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_customer_segments_update"
  ON public.customer_segments FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_customer_segments_delete"
  ON public.customer_segments FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public access to dev tenant expenses" ON public.expenses;
DROP POLICY IF EXISTS "Optimized read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Optimized insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Optimized update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Optimized delete expenses" ON public.expenses;

CREATE POLICY "rls_expenses_select"
  ON public.expenses FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_expenses_insert"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_expenses_update"
  ON public.expenses FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_expenses_delete"
  ON public.expenses FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their tenant's notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their tenant's notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their tenant's notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can select own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated manage notifications" ON public.notifications;

CREATE POLICY "rls_notifications_select"
  ON public.notifications FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_notifications_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_notifications_update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_notifications_delete"
  ON public.notifications FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can update own tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own tenant products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Public access to dev tenant products" ON public.products;
DROP POLICY IF EXISTS "Optimized read products" ON public.products;
DROP POLICY IF EXISTS "Optimized insert products" ON public.products;
DROP POLICY IF EXISTS "Optimized update products" ON public.products;
DROP POLICY IF EXISTS "Optimized delete products" ON public.products;

CREATE POLICY "rls_products_select"
  ON public.products FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_products_insert"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_products_update"
  ON public.products FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_products_delete"
  ON public.products FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- proposal_line_items
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can update own tenant proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can select own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can insert own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can update own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Users can delete own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can view proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Anyone can view proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Anyone can insert proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Anyone can update proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Anyone can delete proposal line items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to read own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to update own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete own tenant proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Authenticated manage proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Optimized read proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Optimized insert proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Optimized update proposal_line_items" ON public.proposal_line_items;
DROP POLICY IF EXISTS "Optimized delete proposal_line_items" ON public.proposal_line_items;

CREATE POLICY "rls_proposal_line_items_select"
  ON public.proposal_line_items FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposal_line_items_insert"
  ON public.proposal_line_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposal_line_items_update"
  ON public.proposal_line_items FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposal_line_items_delete"
  ON public.proposal_line_items FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- proposals
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can insert own tenant proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own tenant proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete own tenant proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Public access to dev tenant proposals" ON public.proposals;
DROP POLICY IF EXISTS "Optimized read proposals" ON public.proposals;
DROP POLICY IF EXISTS "Optimized insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Optimized update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Optimized delete proposals" ON public.proposals;

CREATE POLICY "rls_proposals_select"
  ON public.proposals FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposals_insert"
  ON public.proposals FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposals_update"
  ON public.proposals FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_proposals_delete"
  ON public.proposals FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- purchase_invoices
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can insert purchase invoices for own tenant" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can delete own tenant purchase invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can view own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can insert own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can update own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can delete own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to read own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to update own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to delete own tenant purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Authenticated manage purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Optimized read purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Optimized insert purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Optimized update purchase_invoices" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Optimized delete purchase_invoices" ON public.purchase_invoices;

CREATE POLICY "rls_purchase_invoices_select"
  ON public.purchase_invoices FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_purchase_invoices_insert"
  ON public.purchase_invoices FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_purchase_invoices_update"
  ON public.purchase_invoices FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_purchase_invoices_delete"
  ON public.purchase_invoices FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- stock_movements
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert own tenant stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update own tenant stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete own tenant stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can update stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can delete stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can insert stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can update stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can delete stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Public access to dev tenant stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Optimized read stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Optimized insert stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Optimized update stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Optimized delete stock_movements" ON public.stock_movements;

CREATE POLICY "rls_stock_movements_select"
  ON public.stock_movements FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_stock_movements_insert"
  ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_stock_movements_update"
  ON public.stock_movements FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_stock_movements_delete"
  ON public.stock_movements FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- support_tickets
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tenant tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public access to dev tenant support tickets" ON public.support_tickets;

CREATE POLICY "rls_support_tickets_select"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_support_tickets_insert"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_support_tickets_update"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT auth.uid()));

CREATE POLICY "rls_support_tickets_delete"
  ON public.support_tickets FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.uid()));

-- =============================================================================
-- BÖLÜM 2: FONKSİYON SEARCH PATH (Function Search Path Mutable)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_id integer;
  ticket_num text;
BEGIN
  next_id := nextval('support_ticket_seq');
  ticket_num := 'TKT-' || LPAD(next_id::text, 5, '0');
  RETURN ticket_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- GENEL ÖNERİ – Bu değişikliklerin önemi
-- =============================================================================
-- RLS "Always True" düzeltmesi:
--   • USING (true) / WITH CHECK (true) tüm authenticated kullanıcılara tüm satırlara
--     erişim verir; veritabanı fiilen dış dünyaya açık hale gelir.
--   • tenant_id = (SELECT auth.uid()) ile sadece kendi tenant verinize erişim
--     sınırlanır; çok kiracılı (multi-tenant) veri izolasyonu ve güvenlik sağlanır.
--
-- Function search_path:
--   • search_path belirtilmezse, saldırgan bir rol kendi şemasında aynı isimde
--     nesneler oluşturup fonksiyonun bunları kullanmasını sağlayabilir (search path
--     enjeksiyonu). SET search_path = public bu riski azaltır.
--
-- Leaked Password Protection (Supabase Auth):
--   • Supabase, sızıntıya uğramış şifre veritabanlarıyla eşleşen giriş denemelerini
--     engelleyebilir. Bu özelliğin açık olması, çalınan şifrelerle yapılan otomatik
--     giriş denemelerini (credential stuffing) azaltır ve hesap güvenliğini
--     artırır. Dashboard: Authentication → Settings → Leaked Password Protection.
-- =============================================================================
