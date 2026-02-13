/*
  # Add Plan Feature Assignments & iyzico Integration Fields

  1. New Tables
    - `plan_feature_assignments`
      - Links plan_features to subscription_plans
      - `plan_id` (uuid, FK)
      - `feature_id` (uuid, FK)
      - `enabled` (boolean)
      - `limit_value` (text, nullable) - for limits like "25", "unlimited"
      - Unique constraint on (plan_id, feature_id)

  2. Modified Tables
    - `subscription_plans`
      - Add iyzico integration columns
      - Add display customization columns

  3. Security
    - RLS on plan_feature_assignments
    - Authenticated can read, super_admin can write

  4. Seed
    - Auto-assign features to existing plans
*/

-- Add iyzico and display columns to subscription_plans
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'iyzico_product_ref') THEN
    ALTER TABLE subscription_plans ADD COLUMN iyzico_product_ref text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'iyzico_monthly_plan_ref') THEN
    ALTER TABLE subscription_plans ADD COLUMN iyzico_monthly_plan_ref text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'iyzico_annual_plan_ref') THEN
    ALTER TABLE subscription_plans ADD COLUMN iyzico_annual_plan_ref text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'currency') THEN
    ALTER TABLE subscription_plans ADD COLUMN currency text DEFAULT 'TRY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'setup_fee') THEN
    ALTER TABLE subscription_plans ADD COLUMN setup_fee numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'badge_text') THEN
    ALTER TABLE subscription_plans ADD COLUMN badge_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'badge_color') THEN
    ALTER TABLE subscription_plans ADD COLUMN badge_color text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'highlight') THEN
    ALTER TABLE subscription_plans ADD COLUMN highlight boolean DEFAULT false;
  END IF;
END $$;

-- Create plan_feature_assignments table
CREATE TABLE IF NOT EXISTS plan_feature_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  feature_id uuid NOT NULL REFERENCES plan_features(id),
  enabled boolean DEFAULT true,
  limit_value text,
  UNIQUE(plan_id, feature_id)
);

ALTER TABLE plan_feature_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_feature_assignments' AND policyname = 'Auth users can read feature assignments') THEN
    CREATE POLICY "Auth users can read feature assignments"
      ON plan_feature_assignments FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_feature_assignments' AND policyname = 'Super admins can insert feature assignments') THEN
    CREATE POLICY "Super admins can insert feature assignments"
      ON plan_feature_assignments FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_feature_assignments' AND policyname = 'Super admins can update feature assignments') THEN
    CREATE POLICY "Super admins can update feature assignments"
      ON plan_feature_assignments FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_feature_assignments' AND policyname = 'Super admins can delete feature assignments') THEN
    CREATE POLICY "Super admins can delete feature assignments"
      ON plan_feature_assignments FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pfa_plan_id ON plan_feature_assignments(plan_id);
CREATE INDEX IF NOT EXISTS idx_pfa_feature_id ON plan_feature_assignments(feature_id);

-- Seed feature assignments for existing plans
-- FREE plan
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT sp.id, pf.id, true,
  CASE
    WHEN pf.feature_key = 'customer_limit' THEN '25'
    WHEN pf.feature_key = 'product_limit' THEN '50'
    WHEN pf.feature_key = 'invoice_limit' THEN '15/ay'
    WHEN pf.feature_key = 'user_limit' THEN '1'
    ELSE NULL
  END
FROM subscription_plans sp
CROSS JOIN plan_features pf
WHERE sp.plan_code = 'FREE'
AND pf.feature_key IN ('dashboard','customers','products','invoices','customer_limit','product_limit','invoice_limit','user_limit','reports_basic','support_email','data_export')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- SMALL plan
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT sp.id, pf.id, true,
  CASE
    WHEN pf.feature_key = 'customer_limit' THEN '250'
    WHEN pf.feature_key = 'product_limit' THEN '500'
    WHEN pf.feature_key = 'invoice_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'user_limit' THEN '3'
    ELSE NULL
  END
FROM subscription_plans sp
CROSS JOIN plan_features pf
WHERE sp.plan_code = 'SMALL'
AND pf.feature_key IN ('dashboard','customers','products','invoices','expenses','finance','inventory','customer_limit','product_limit','invoice_limit','user_limit','reports_basic','support_email','data_export')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- MEDIUM plan
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT sp.id, pf.id, true,
  CASE
    WHEN pf.feature_key = 'customer_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'product_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'invoice_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'user_limit' THEN '10'
    ELSE NULL
  END
FROM subscription_plans sp
CROSS JOIN plan_features pf
WHERE sp.plan_code = 'MEDIUM'
AND pf.feature_key IN ('dashboard','customers','products','invoices','expenses','finance','inventory','proposals','campaigns','customer_limit','product_limit','invoice_limit','user_limit','reports_basic','reports_advanced','support_email','support_live','multi_user','role_management','data_export')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- LARGE plan
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT sp.id, pf.id, true,
  CASE
    WHEN pf.feature_key = 'customer_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'product_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'invoice_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'user_limit' THEN '25'
    ELSE NULL
  END
FROM subscription_plans sp
CROSS JOIN plan_features pf
WHERE sp.plan_code = 'LARGE'
AND pf.feature_key IN ('dashboard','customers','products','invoices','expenses','finance','inventory','proposals','campaigns','customer_limit','product_limit','invoice_limit','user_limit','reports_basic','reports_advanced','ai_cfo','ai_insights','ai_chat','auto_reports','einvoice','earchive','support_email','support_live','support_priority','multi_user','role_management','data_export')
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- ENTERPRISE plan
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT sp.id, pf.id, true,
  CASE
    WHEN pf.feature_key = 'customer_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'product_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'invoice_limit' THEN 'Sinirsiz'
    WHEN pf.feature_key = 'user_limit' THEN 'Sinirsiz'
    ELSE NULL
  END
FROM subscription_plans sp
CROSS JOIN plan_features pf
WHERE sp.plan_code = 'ENTERPRISE'
ON CONFLICT (plan_id, feature_id) DO NOTHING;

-- Update highlight for popular plan
UPDATE subscription_plans SET highlight = true, badge_text = 'En Populer', badge_color = '#10b981' WHERE plan_code = 'MEDIUM';
UPDATE subscription_plans SET badge_text = 'En Iyi Deger', badge_color = '#f59e0b' WHERE plan_code = 'LARGE';
