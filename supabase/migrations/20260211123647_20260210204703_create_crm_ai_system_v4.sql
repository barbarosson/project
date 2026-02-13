/*
  # Create Predictive CRM AI Module

  1. New Tables
    - `customer_interactions` - Sentiment analysis tracking
    - `crm_ai_insights` - AI predictions and recommendations
    - `crm_tasks` - CRM tasks and follow-ups
    - `customer_segment_history` - Segment change tracking

  2. Enhancements
    - Add CRM fields to existing customers table
    - Create Customer 360 view

  3. Security
    - RLS enabled on all new tables
*/

-- Add CRM fields to customers table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'segment') THEN
    ALTER TABLE public.customers ADD COLUMN segment TEXT DEFAULT 'New';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'clv') THEN
    ALTER TABLE public.customers ADD COLUMN clv DECIMAL(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'payment_score') THEN
    ALTER TABLE public.customers ADD COLUMN payment_score DECIMAL(3,2) DEFAULT 0.70;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'churn_probability') THEN
    ALTER TABLE public.customers ADD COLUMN churn_probability DECIMAL(3,2) DEFAULT 0.30;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'churn_risk_level') THEN
    ALTER TABLE public.customers ADD COLUMN churn_risk_level TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'health_score') THEN
    ALTER TABLE public.customers ADD COLUMN health_score DECIMAL(3,2) DEFAULT 0.70;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
    ALTER TABLE public.customers ADD COLUMN total_orders INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'average_order_value') THEN
    ALTER TABLE public.customers ADD COLUMN average_order_value DECIMAL(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_order_date') THEN
    ALTER TABLE public.customers ADD COLUMN first_order_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_order_date') THEN
    ALTER TABLE public.customers ADD COLUMN last_order_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'days_since_last_order') THEN
    ALTER TABLE public.customers ADD COLUMN days_since_last_order INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_invoices') THEN
    ALTER TABLE public.customers ADD COLUMN total_invoices INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'paid_on_time_count') THEN
    ALTER TABLE public.customers ADD COLUMN paid_on_time_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'late_payment_count') THEN
    ALTER TABLE public.customers ADD COLUMN late_payment_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'average_payment_delay_days') THEN
    ALTER TABLE public.customers ADD COLUMN average_payment_delay_days DECIMAL(5,1) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tags') THEN
    ALTER TABLE public.customers ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_clv ON public.customers(clv DESC);
CREATE INDEX IF NOT EXISTS idx_customers_churn ON public.customers(churn_probability DESC);

-- Customer Interactions Table
CREATE TABLE IF NOT EXISTS public.customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL,
    subject TEXT,
    notes TEXT NOT NULL,
    
    sentiment_score DECIMAL(3,2),
    sentiment_label TEXT,
    keywords TEXT[],
    topics TEXT[],
    
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_customer ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON public.customer_interactions(created_at DESC);

ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage interactions"
    ON public.customer_interactions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- CRM AI Insights Table
CREATE TABLE IF NOT EXISTS public.crm_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    churn_probability DECIMAL(3,2) NOT NULL,
    churn_risk_level TEXT,
    churn_factors JSONB,
    
    predicted_clv_12m DECIMAL(15,2),
    predicted_clv_24m DECIMAL(15,2),
    clv_confidence_score DECIMAL(3,2),
    
    next_purchase_prediction DATE,
    next_purchase_probability DECIMAL(3,2),
    
    suggested_products JSONB,
    engagement_score DECIMAL(3,2),
    engagement_trend TEXT,
    recommended_actions JSONB,
    
    model_version TEXT DEFAULT '1.0',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    
    CONSTRAINT unique_customer_insight UNIQUE (customer_id)
);

CREATE INDEX IF NOT EXISTS idx_insights_customer ON public.crm_ai_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_insights_churn ON public.crm_ai_insights(churn_probability DESC);

ALTER TABLE public.crm_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage insights"
    ON public.crm_ai_insights FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- CRM Tasks Table
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT,
    
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    is_ai_generated BOOLEAN DEFAULT false,
    ai_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_customer ON public.crm_tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.crm_tasks(status);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tasks"
    ON public.crm_tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Customer Segment History
CREATE TABLE IF NOT EXISTS public.customer_segment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    old_segment TEXT,
    new_segment TEXT NOT NULL,
    reason TEXT,
    triggered_by TEXT,
    
    clv_at_change DECIMAL(15,2),
    churn_probability_at_change DECIMAL(3,2),
    
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segment_history_customer ON public.customer_segment_history(customer_id);

ALTER TABLE public.customer_segment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view segment history"
    ON public.customer_segment_history FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Customer 360 View
CREATE OR REPLACE VIEW public.v_customer_360 AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.segment,
    c.clv,
    c.payment_score,
    c.churn_probability,
    c.churn_risk_level,
    c.health_score,
    c.total_orders,
    c.total_revenue,
    c.average_order_value,
    c.days_since_last_order,
    CASE
        WHEN c.total_invoices > 0 THEN
            ROUND((c.paid_on_time_count::DECIMAL / c.total_invoices * 100), 2)
        ELSE 0
    END as on_time_payment_rate,
    c.average_payment_delay_days,
    ai.recommended_actions,
    ai.engagement_score,
    ai.next_purchase_prediction
FROM public.customers c
LEFT JOIN public.crm_ai_insights ai ON c.id = ai.customer_id;