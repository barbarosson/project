/*
  # Add Missing Foreign Key Indexes for user_id Fields (Verified Version)

  ## Performance & Security Enhancement
  
  1. Issues Fixed
    - Unindexed foreign keys on user_id columns
    - Improves JOIN performance with auth.users
    - Essential for RLS policy optimization
    - Prevents full table scans on user lookups

  2. Safety
    - Checks if both table AND column exist before creating index
    - Uses IF NOT EXISTS to prevent conflicts
*/

DO $$
BEGIN
  -- Activity Log
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_user_id_fk ON public.activity_log(user_id);
  END IF;

  -- Admin Logs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_logs' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id_fk ON public.admin_logs(user_id);
  END IF;

  -- AI Chat Conversations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_chat_conversations' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user_id_fk ON public.ai_chat_conversations(user_id);
  END IF;

  -- CRM Tasks - assigned_to
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_tasks' AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to_fk ON public.crm_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
  END IF;

  -- Demo Requests - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_requests' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_demo_requests_user_id_fk ON public.demo_requests(user_id) WHERE user_id IS NOT NULL;
  END IF;

  -- Demo Requests - processed_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_requests' AND column_name = 'processed_by') THEN
    CREATE INDEX IF NOT EXISTS idx_demo_requests_processed_by_fk ON public.demo_requests(processed_by) WHERE processed_by IS NOT NULL;
  END IF;

  -- E-Document Activity Log
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'edocument_activity_log' AND column_name = 'performed_by') THEN
    CREATE INDEX IF NOT EXISTS idx_edocument_activity_log_performed_by_fk ON public.edocument_activity_log(performed_by);
  END IF;

  -- Executive Meetings - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_meetings' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_meetings_user_id_fk ON public.executive_meetings(user_id);
  END IF;

  -- Executive Meetings - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_meetings' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_meetings_created_by_fk ON public.executive_meetings(created_by);
  END IF;

  -- Executive Obligations - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_obligations' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_obligations_user_id_fk ON public.executive_obligations(user_id);
  END IF;

  -- Executive Obligations - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_obligations' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_obligations_created_by_fk ON public.executive_obligations(created_by);
  END IF;

  -- Executive Reminders - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_reminders' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_reminders_user_id_fk ON public.executive_reminders(user_id);
  END IF;

  -- Executive Reminders - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'executive_reminders' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_executive_reminders_created_by_fk ON public.executive_reminders(created_by);
  END IF;

  -- Expenses - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by_fk ON public.expenses(created_by) WHERE created_by IS NOT NULL;
  END IF;

  -- Finance Robot Conversations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'finance_robot_conversations' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_finance_robot_conversations_user_id_fk ON public.finance_robot_conversations(user_id);
  END IF;

  -- Marketplace Accounts - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_accounts' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_user_id_fk ON public.marketplace_accounts(user_id) WHERE user_id IS NOT NULL;
  END IF;

  -- Marketplace Accounts - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_accounts' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_created_by_fk ON public.marketplace_accounts(created_by);
  END IF;

  -- Payroll - user_id (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_user_id_fk ON public.payroll(user_id);
  END IF;

  -- Payroll - approved_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll' AND column_name = 'approved_by') THEN
    CREATE INDEX IF NOT EXISTS idx_payroll_approved_by_fk ON public.payroll(approved_by) WHERE approved_by IS NOT NULL;
  END IF;

  -- Posts - author_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'author_id') THEN
    CREATE INDEX IF NOT EXISTS idx_posts_author_id_fk ON public.posts(author_id);
  END IF;

  -- Purchase Orders - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by_fk ON public.purchase_orders(created_by);
  END IF;

  -- Purchase Orders - approved_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'approved_by') THEN
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_by_fk ON public.purchase_orders(approved_by) WHERE approved_by IS NOT NULL;
  END IF;

  -- Purchase Orders - received_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'received_by') THEN
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_received_by_fk ON public.purchase_orders(received_by) WHERE received_by IS NOT NULL;
  END IF;

  -- Stock Movements - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by_fk ON public.stock_movements(created_by) WHERE created_by IS NOT NULL;
  END IF;

  -- Stress Test Results
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stress_test_results' AND column_name = 'executed_by') THEN
    CREATE INDEX IF NOT EXISTS idx_stress_test_results_executed_by_fk ON public.stress_test_results(executed_by);
  END IF;

  -- Support Chat Sessions - user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_chat_sessions' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id_fk ON public.support_chat_sessions(user_id);
  END IF;

  -- Support Chat Sessions - agent_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_chat_sessions' AND column_name = 'agent_id') THEN
    CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_agent_id_fk ON public.support_chat_sessions(agent_id) WHERE agent_id IS NOT NULL;
  END IF;

  -- Support Messages - sender_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_messages' AND column_name = 'sender_id') THEN
    CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id_fk ON public.support_messages(sender_id);
  END IF;

  -- Support Tickets - created_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by_fk ON public.support_tickets(created_by);
  END IF;

  -- Support Tickets - assigned_to
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to_fk ON public.support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
  END IF;

  -- Test Results
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_results' AND column_name = 'executed_by') THEN
    CREATE INDEX IF NOT EXISTS idx_test_results_executed_by_fk ON public.test_results(executed_by);
  END IF;

  -- Trend Saved Reports
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trend_saved_reports' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_trend_saved_reports_user_id_fk ON public.trend_saved_reports(user_id);
  END IF;

  -- Trend Searches
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trend_searches' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_trend_searches_user_id_fk ON public.trend_searches(user_id);
  END IF;

  -- Warehouse Transfers - initiated_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'warehouse_transfers' AND column_name = 'initiated_by') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_initiated_by_fk ON public.warehouse_transfers(initiated_by);
  END IF;

  -- Warehouse Transfers - approved_by
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'warehouse_transfers' AND column_name = 'approved_by') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_approved_by_fk ON public.warehouse_transfers(approved_by) WHERE approved_by IS NOT NULL;
  END IF;

  RAISE NOTICE 'Foreign key indexes created successfully for all existing columns';
END $$;
