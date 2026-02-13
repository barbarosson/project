/*
  # Fix Critical Security and Performance Issues - Final
  
  ## Security Fixes
  
  1. **Missing Foreign Key Indexes** - Performance improvement
  2. **RLS Policies Always True** - CRITICAL security fix
  3. **RLS Performance Optimization** - Wrap auth functions in SELECT
  4. **Function Security** - Fix mutable search_path
  5. **Index Cleanup** - Remove duplicate constraints
*/

-- =====================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_faqs_created_by ON public.faqs(created_by);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id ON public.invoice_line_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_product_id ON public.invoice_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_product_id ON public.proposal_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON public.proposals(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_product_id ON public.purchase_invoice_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_purchase_invoice_id ON public.purchase_invoice_line_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON public.support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);

-- =====================================================
-- SECTION 2: REMOVE DUPLICATE CONSTRAINTS
-- =====================================================

ALTER TABLE public.site_config DROP CONSTRAINT IF EXISTS site_config_key_key;

-- =====================================================
-- SECTION 3: FIX RLS POLICIES THAT ARE ALWAYS TRUE
-- =====================================================

-- cms_banners
DROP POLICY IF EXISTS "Authenticated users can insert banners" ON public.cms_banners;
DROP POLICY IF EXISTS "Authenticated users can update banners" ON public.cms_banners;
DROP POLICY IF EXISTS "Authenticated users can delete banners" ON public.cms_banners;

CREATE POLICY "Authenticated users can insert banners" ON public.cms_banners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

CREATE POLICY "Authenticated users can update banners" ON public.cms_banners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

CREATE POLICY "Authenticated users can delete banners" ON public.cms_banners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

-- ui_styles
DROP POLICY IF EXISTS "Authenticated users can insert ui_styles" ON public.ui_styles;
DROP POLICY IF EXISTS "Authenticated users can update ui_styles" ON public.ui_styles;

CREATE POLICY "Authenticated users can insert ui_styles" ON public.ui_styles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

CREATE POLICY "Authenticated users can update ui_styles" ON public.ui_styles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

-- ui_colors
DROP POLICY IF EXISTS "Authenticated users can insert ui_colors" ON public.ui_colors;
DROP POLICY IF EXISTS "Authenticated users can update ui_colors" ON public.ui_colors;

CREATE POLICY "Authenticated users can insert ui_colors" ON public.ui_colors FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

CREATE POLICY "Authenticated users can update ui_colors" ON public.ui_colors FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

-- ui_toggles
DROP POLICY IF EXISTS "Authenticated users can insert ui_toggles" ON public.ui_toggles;
DROP POLICY IF EXISTS "Authenticated users can update ui_toggles" ON public.ui_toggles;

CREATE POLICY "Authenticated users can insert ui_toggles" ON public.ui_toggles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

CREATE POLICY "Authenticated users can update ui_toggles" ON public.ui_toggles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@modulus.com'));

-- =====================================================
-- SECTION 4: OPTIMIZE RLS POLICIES WITH AUTH FUNCTIONS
-- =====================================================

-- banners
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Super admin can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Super admin can update banners" ON public.banners;
DROP POLICY IF EXISTS "Super admin can delete banners" ON public.banners;

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Super admin can insert banners" ON public.banners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));
CREATE POLICY "Super admin can update banners" ON public.banners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));
CREATE POLICY "Super admin can delete banners" ON public.banners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- navigation_menus
DROP POLICY IF EXISTS "Anyone can view visible menus" ON public.navigation_menus;
DROP POLICY IF EXISTS "Super admin can insert menus" ON public.navigation_menus;
DROP POLICY IF EXISTS "Super admin can update menus" ON public.navigation_menus;
DROP POLICY IF EXISTS "Super admin can delete menus" ON public.navigation_menus;

CREATE POLICY "Anyone can view visible menus" ON public.navigation_menus FOR SELECT TO public USING (is_visible = true);
CREATE POLICY "Super admin can insert menus" ON public.navigation_menus FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));
CREATE POLICY "Super admin can update menus" ON public.navigation_menus FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));
CREATE POLICY "Super admin can delete menus" ON public.navigation_menus FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- credit_balances
DROP POLICY IF EXISTS "Users can view own credits" ON public.credit_balances;
DROP POLICY IF EXISTS "Users can update own credits" ON public.credit_balances;

CREATE POLICY "Users can view own credits" ON public.credit_balances FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own credits" ON public.credit_balances FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- posts
DROP POLICY IF EXISTS "Authenticated users can manage posts in their tenant" ON public.posts;
CREATE POLICY "Authenticated users can manage posts in their tenant" ON public.posts FOR ALL TO authenticated
  USING (tenant_id = (SELECT auth.uid())) WITH CHECK (tenant_id = (SELECT auth.uid()));

-- admin_logs
DROP POLICY IF EXISTS "Authenticated users can view logs in their tenant" ON public.admin_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.admin_logs;

CREATE POLICY "Authenticated users can view logs in their tenant" ON public.admin_logs FOR SELECT TO authenticated USING (tenant_id = (SELECT auth.uid()));
CREATE POLICY "System can insert logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (true);

-- demo_requests
DROP POLICY IF EXISTS "user_select_own_demo_requests" ON public.demo_requests;
CREATE POLICY "user_select_own_demo_requests" ON public.demo_requests FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- faqs
DROP POLICY IF EXISTS "Admins can manage all FAQs" ON public.faqs;
CREATE POLICY "Admins can manage all FAQs" ON public.faqs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- support_chat_sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.support_chat_sessions;

CREATE POLICY "Users can view own chat sessions" ON public.support_chat_sessions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own chat sessions" ON public.support_chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own chat sessions" ON public.support_chat_sessions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own chat sessions" ON public.support_chat_sessions FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- support_messages
DROP POLICY IF EXISTS "Users can view own session messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.support_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.support_messages;

CREATE POLICY "Users can view own session messages" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_chat_sessions WHERE support_chat_sessions.id = support_messages.session_id AND support_chat_sessions.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can create messages in own sessions" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_chat_sessions WHERE support_chat_sessions.id = support_messages.session_id AND support_chat_sessions.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can update own messages" ON public.support_messages FOR UPDATE TO authenticated
  USING (sender_id = (SELECT auth.uid())) WITH CHECK (sender_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.support_messages FOR DELETE TO authenticated USING (sender_id = (SELECT auth.uid()));

-- coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- customer_reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.customer_reviews;
CREATE POLICY "Admins can manage reviews" ON public.customer_reviews FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'))
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = (SELECT auth.uid()) AND auth.users.email = 'admin@modulus.com'));

-- tenants
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can create own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete own tenant" ON public.tenants;

CREATE POLICY "Users can view own tenant" ON public.tenants FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own tenant" ON public.tenants FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own tenant" ON public.tenants FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own tenant" ON public.tenants FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

-- =====================================================
-- SECTION 5: FIX FUNCTION SEARCH PATHS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_site_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_post_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_faq_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_review_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
