/*
  # Create Missing Core Tables

  This migration creates tables referenced by application code but not yet in the database.

  1. New Tables
    - `credit_balances` - User credit balances for OCR and e-Invoice
    - `customer_reviews` - Customer testimonials for marketing
    - `faqs` - Help center FAQ entries
    - `plan_features` - Feature definitions for subscription plans
    - `plan_feature_assignments` - Maps features to plans
    - `plan_discounts` - Discount/coupon codes for plans
    - `plan_installment_options` - Installment payment options
    - `ui_toggles` - UI section visibility toggles

  2. Security
    - RLS enabled on all tables
    - Admin-only write access where applicable
    - Authenticated read access
*/

-- =============================================
-- 1. credit_balances
-- =============================================
CREATE TABLE IF NOT EXISTS credit_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ocr_credits integer NOT NULL DEFAULT 5,
  e_fatura_credits integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_balances_user_id_unique UNIQUE (user_id)
);

ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit balance" ON credit_balances;
DROP POLICY IF EXISTS "Users can insert own credit balance" ON credit_balances;
DROP POLICY IF EXISTS "Users can update own credit balance" ON credit_balances;
DROP POLICY IF EXISTS "Users can delete own credit balance" ON credit_balances;

CREATE POLICY "Users can view own credit balance"
  ON credit_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit balance"
  ON credit_balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit balance"
  ON credit_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. customer_reviews
-- =============================================
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  review_en text NOT NULL DEFAULT '',
  review_tr text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  logo_url text DEFAULT '',
  avatar_url text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view customer reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Admins can insert customer reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Admins can update customer reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Admins can delete customer reviews" ON customer_reviews;

CREATE POLICY "Authenticated users can view customer reviews"
  ON customer_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert customer reviews"
  ON customer_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update customer reviews"
  ON customer_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete customer reviews"
  ON customer_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 3. faqs
-- =============================================
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL DEFAULT '',
  question_tr text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  answer_tr text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view faqs" ON faqs;
DROP POLICY IF EXISTS "Admins can insert faqs" ON faqs;
DROP POLICY IF EXISTS "Admins can update faqs" ON faqs;
DROP POLICY IF EXISTS "Admins can delete faqs" ON faqs;

CREATE POLICY "Authenticated users can view faqs"
  ON faqs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert faqs"
  ON faqs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update faqs"
  ON faqs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete faqs"
  ON faqs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 4. plan_features
-- =============================================
CREATE TABLE IF NOT EXISTS plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  name_tr text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  description_tr text DEFAULT '',
  description_en text DEFAULT '',
  category text NOT NULL DEFAULT 'Temel Moduller',
  display_order integer NOT NULL DEFAULT 0,
  is_limit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_features_feature_key_unique UNIQUE (feature_key)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view plan features" ON plan_features;
DROP POLICY IF EXISTS "Admins can insert plan features" ON plan_features;
DROP POLICY IF EXISTS "Admins can update plan features" ON plan_features;
DROP POLICY IF EXISTS "Admins can delete plan features" ON plan_features;

CREATE POLICY "Authenticated users can view plan features"
  ON plan_features FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert plan features"
  ON plan_features FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update plan features"
  ON plan_features FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete plan features"
  ON plan_features FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 5. plan_feature_assignments
-- =============================================
CREATE TABLE IF NOT EXISTS plan_feature_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  limit_value text DEFAULT NULL,
  CONSTRAINT plan_feature_assignments_plan_feature_unique UNIQUE (plan_id, feature_id)
);

ALTER TABLE plan_feature_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view feature assignments" ON plan_feature_assignments;
DROP POLICY IF EXISTS "Admins can insert feature assignments" ON plan_feature_assignments;
DROP POLICY IF EXISTS "Admins can update feature assignments" ON plan_feature_assignments;
DROP POLICY IF EXISTS "Admins can delete feature assignments" ON plan_feature_assignments;

CREATE POLICY "Authenticated users can view feature assignments"
  ON plan_feature_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert feature assignments"
  ON plan_feature_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update feature assignments"
  ON plan_feature_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete feature assignments"
  ON plan_feature_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 6. plan_discounts
-- =============================================
CREATE TABLE IF NOT EXISTS plan_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 10,
  coupon_code text DEFAULT NULL,
  valid_from date DEFAULT NULL,
  valid_until date DEFAULT NULL,
  max_uses integer NOT NULL DEFAULT 0,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  applies_to_billing text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view plan discounts" ON plan_discounts;
DROP POLICY IF EXISTS "Admins can insert plan discounts" ON plan_discounts;
DROP POLICY IF EXISTS "Admins can update plan discounts" ON plan_discounts;
DROP POLICY IF EXISTS "Admins can delete plan discounts" ON plan_discounts;

CREATE POLICY "Authenticated users can view plan discounts"
  ON plan_discounts FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert plan discounts"
  ON plan_discounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update plan discounts"
  ON plan_discounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete plan discounts"
  ON plan_discounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 7. plan_installment_options
-- =============================================
CREATE TABLE IF NOT EXISTS plan_installment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  installment_count integer NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  total_price_tl numeric DEFAULT NULL,
  monthly_amount_tl numeric DEFAULT NULL,
  total_price_usd numeric DEFAULT NULL,
  monthly_amount_usd numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_installment_options_plan_count_unique UNIQUE (plan_id, installment_count)
);

ALTER TABLE plan_installment_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view installment options" ON plan_installment_options;
DROP POLICY IF EXISTS "Admins can insert installment options" ON plan_installment_options;
DROP POLICY IF EXISTS "Admins can update installment options" ON plan_installment_options;
DROP POLICY IF EXISTS "Admins can delete installment options" ON plan_installment_options;

CREATE POLICY "Authenticated users can view installment options"
  ON plan_installment_options FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert installment options"
  ON plan_installment_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update installment options"
  ON plan_installment_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete installment options"
  ON plan_installment_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =============================================
-- 8. ui_toggles
-- =============================================
CREATE TABLE IF NOT EXISTS ui_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ui_toggles_element_name_unique UNIQUE (element_name)
);

ALTER TABLE ui_toggles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view ui toggles" ON ui_toggles;
DROP POLICY IF EXISTS "Admins can insert ui toggles" ON ui_toggles;
DROP POLICY IF EXISTS "Admins can update ui toggles" ON ui_toggles;
DROP POLICY IF EXISTS "Admins can delete ui toggles" ON ui_toggles;

CREATE POLICY "Authenticated users can view ui toggles"
  ON ui_toggles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert ui toggles"
  ON ui_toggles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update ui toggles"
  ON ui_toggles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ui_toggles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ui_toggles;
  END IF;
END $$;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_credit_balances_user_id ON credit_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_feature_assignments_plan_id ON plan_feature_assignments(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_feature_assignments_feature_id ON plan_feature_assignments(feature_id);
CREATE INDEX IF NOT EXISTS idx_plan_discounts_plan_id ON plan_discounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_installment_options_plan_id ON plan_installment_options(plan_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order_index ON customer_reviews(order_index);
CREATE INDEX IF NOT EXISTS idx_faqs_category_order ON faqs(category, order_index);
