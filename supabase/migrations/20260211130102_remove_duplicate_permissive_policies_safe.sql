/*
  # Remove Duplicate Permissive RLS Policies (Safe)

  ## Security & Performance Enhancement
  
  Removes duplicate permissive policies that bypass security
  Only drops policies on existing tables
*/

DO $$
BEGIN
  -- CUSTOMER_INTERACTIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_interactions') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_interactions' AND policyname = 'Authenticated users can manage interactions') THEN
      DROP POLICY "Authenticated users can manage interactions" ON public.customer_interactions;
    END IF;
  END IF;

  -- CRM_AI_INSIGHTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_ai_insights') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_ai_insights' AND policyname = 'Authenticated users can manage insights') THEN
      DROP POLICY "Authenticated users can manage insights" ON public.crm_ai_insights;
    END IF;
  END IF;

  -- CRM_TASKS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_tasks') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_tasks' AND policyname = 'Authenticated users can manage tasks') THEN
      DROP POLICY "Authenticated users can manage tasks" ON public.crm_tasks;
    END IF;
  END IF;

  -- CUSTOMER_SEGMENT_HISTORY
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_segment_history') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_segment_history' AND policyname = 'Authenticated users can view segment history') THEN
      DROP POLICY "Authenticated users can view segment history" ON public.customer_segment_history;
    END IF;
  END IF;

  -- SUPPORT_CHAT_SESSIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_chat_sessions') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_chat_sessions' AND policyname = 'Authenticated users can view all sessions') THEN
      DROP POLICY "Authenticated users can view all sessions" ON public.support_chat_sessions;
    END IF;
  END IF;

  -- SUPPORT_MESSAGES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_messages') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_messages' AND policyname = 'Authenticated users can view all messages') THEN
      DROP POLICY "Authenticated users can view all messages" ON public.support_messages;
    END IF;
  END IF;

  -- DEMO_REQUESTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'demo_requests') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'demo_requests' AND policyname = 'Authenticated users can view demo requests') THEN
      DROP POLICY "Authenticated users can view demo requests" ON public.demo_requests;
    END IF;
  END IF;

  -- EDOCUMENTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edocuments') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'edocuments' AND policyname = 'Authenticated users can manage edocuments') THEN
      DROP POLICY "Authenticated users can manage edocuments" ON public.edocuments;
    END IF;
  END IF;

  -- EDOCUMENT_ACTIVITY_LOG
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edocument_activity_log') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'edocument_activity_log' AND policyname = 'Authenticated users can manage edocument activity') THEN
      DROP POLICY "Authenticated users can manage edocument activity" ON public.edocument_activity_log;
    END IF;
  END IF;

  -- EXECUTIVE_MEETINGS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'executive_meetings') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'executive_meetings' AND policyname = 'Authenticated users can manage meetings') THEN
      DROP POLICY "Authenticated users can manage meetings" ON public.executive_meetings;
    END IF;
  END IF;

  -- EXECUTIVE_OBLIGATIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'executive_obligations') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'executive_obligations' AND policyname = 'Authenticated users can manage obligations') THEN
      DROP POLICY "Authenticated users can manage obligations" ON public.executive_obligations;
    END IF;
  END IF;

  -- EXECUTIVE_REMINDERS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'executive_reminders') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'executive_reminders' AND policyname = 'Authenticated users can manage reminders') THEN
      DROP POLICY "Authenticated users can manage reminders" ON public.executive_reminders;
    END IF;
  END IF;

  -- MARKETPLACE_ACCOUNTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_accounts') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_accounts' AND policyname = 'Authenticated users can manage marketplace accounts') THEN
      DROP POLICY "Authenticated users can manage marketplace accounts" ON public.marketplace_accounts;
    END IF;
  END IF;

  -- MARKETPLACE_PRODUCTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_products') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_products' AND policyname = 'Authenticated users can manage marketplace products') THEN
      DROP POLICY "Authenticated users can manage marketplace products" ON public.marketplace_products;
    END IF;
  END IF;

  -- MARKETPLACE_ORDERS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_orders') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_orders' AND policyname = 'Authenticated users can manage marketplace orders') THEN
      DROP POLICY "Authenticated users can manage marketplace orders" ON public.marketplace_orders;
    END IF;
  END IF;

  -- TREND_SEARCHES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trend_searches') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trend_searches' AND policyname = 'Authenticated users can manage trend searches') THEN
      DROP POLICY "Authenticated users can manage trend searches" ON public.trend_searches;
    END IF;
  END IF;

  -- TREND_SAVED_REPORTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trend_saved_reports') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trend_saved_reports' AND policyname = 'Authenticated users can manage saved reports') THEN
      DROP POLICY "Authenticated users can manage saved reports" ON public.trend_saved_reports;
    END IF;
  END IF;

  -- AI_CASH_FLOW_PREDICTIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_cash_flow_predictions') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_cash_flow_predictions' AND policyname = 'Authenticated users can manage predictions') THEN
      DROP POLICY "Authenticated users can manage predictions" ON public.ai_cash_flow_predictions;
    END IF;
  END IF;

  -- PRODUCTION_DECISION_FACTORS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_decision_factors') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'production_decision_factors' AND policyname = 'Authenticated users can manage production decisions') THEN
      DROP POLICY "Authenticated users can manage production decisions" ON public.production_decision_factors;
    END IF;
  END IF;

  -- EINVOICES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'einvoices') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'einvoices' AND policyname = 'Authenticated users can manage einvoices') THEN
      DROP POLICY "Authenticated users can manage einvoices" ON public.einvoices;
    END IF;
  END IF;

  -- EINVOICE_ITEMS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'einvoice_items') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'einvoice_items' AND policyname = 'Authenticated users can manage einvoice items') THEN
      DROP POLICY "Authenticated users can manage einvoice items" ON public.einvoice_items;
    END IF;
  END IF;

  RAISE NOTICE 'Duplicate permissive policies removed successfully';
END $$;
