/*
  # Optimize Remaining RLS Policies (Corrected)

  This migration optimizes the remaining RLS policies that use auth functions
  by wrapping them with (select ...) to prevent re-evaluation for each row.

  ## Changes
  - Optimize FAQs, customer_reviews, plan_features, ui_toggles
  - Optimize plan_feature_assignments, plan_discounts, plan_installment_options
*/

-- FAQs
DROP POLICY IF EXISTS "Admins can delete faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can insert faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can update faqs" ON public.faqs;
DROP POLICY IF EXISTS "Authenticated users can view faqs" ON public.faqs;

CREATE POLICY "Admins can delete faqs" ON public.faqs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert faqs" ON public.faqs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update faqs" ON public.faqs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view faqs" ON public.faqs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Customer Reviews
DROP POLICY IF EXISTS "Admins can delete customer reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Admins can insert customer reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Admins can update customer reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Authenticated users can view customer reviews" ON public.customer_reviews;

CREATE POLICY "Admins can delete customer reviews" ON public.customer_reviews
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert customer reviews" ON public.customer_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update customer reviews" ON public.customer_reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view customer reviews" ON public.customer_reviews
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Plan Features
DROP POLICY IF EXISTS "Admins can delete plan features" ON public.plan_features;
DROP POLICY IF EXISTS "Admins can insert plan features" ON public.plan_features;
DROP POLICY IF EXISTS "Admins can update plan features" ON public.plan_features;
DROP POLICY IF EXISTS "Authenticated users can view plan features" ON public.plan_features;

CREATE POLICY "Admins can delete plan features" ON public.plan_features
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert plan features" ON public.plan_features
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update plan features" ON public.plan_features
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view plan features" ON public.plan_features
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- UI Toggles
DROP POLICY IF EXISTS "Admins can insert ui toggles" ON public.ui_toggles;
DROP POLICY IF EXISTS "Admins can update ui toggles" ON public.ui_toggles;
DROP POLICY IF EXISTS "Authenticated users can view ui toggles" ON public.ui_toggles;

CREATE POLICY "Admins can insert ui toggles" ON public.ui_toggles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update ui toggles" ON public.ui_toggles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view ui toggles" ON public.ui_toggles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Plan Feature Assignments
DROP POLICY IF EXISTS "Admins can delete feature assignments" ON public.plan_feature_assignments;
DROP POLICY IF EXISTS "Admins can insert feature assignments" ON public.plan_feature_assignments;
DROP POLICY IF EXISTS "Admins can update feature assignments" ON public.plan_feature_assignments;
DROP POLICY IF EXISTS "Authenticated users can view feature assignments" ON public.plan_feature_assignments;

CREATE POLICY "Admins can delete feature assignments" ON public.plan_feature_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert feature assignments" ON public.plan_feature_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update feature assignments" ON public.plan_feature_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view feature assignments" ON public.plan_feature_assignments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Plan Discounts
DROP POLICY IF EXISTS "Admins can delete plan discounts" ON public.plan_discounts;
DROP POLICY IF EXISTS "Admins can insert plan discounts" ON public.plan_discounts;
DROP POLICY IF EXISTS "Admins can update plan discounts" ON public.plan_discounts;
DROP POLICY IF EXISTS "Authenticated users can view plan discounts" ON public.plan_discounts;

CREATE POLICY "Admins can delete plan discounts" ON public.plan_discounts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert plan discounts" ON public.plan_discounts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update plan discounts" ON public.plan_discounts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view plan discounts" ON public.plan_discounts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Plan Installment Options
DROP POLICY IF EXISTS "Admins can delete installment options" ON public.plan_installment_options;
DROP POLICY IF EXISTS "Admins can insert installment options" ON public.plan_installment_options;
DROP POLICY IF EXISTS "Admins can update installment options" ON public.plan_installment_options;
DROP POLICY IF EXISTS "Authenticated users can view installment options" ON public.plan_installment_options;

CREATE POLICY "Admins can delete installment options" ON public.plan_installment_options
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can insert installment options" ON public.plan_installment_options
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Admins can update installment options" ON public.plan_installment_options
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY(ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY "Authenticated users can view installment options" ON public.plan_installment_options
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);