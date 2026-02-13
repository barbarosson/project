/*
  # Optimize Admin Profile Policy

  ## Overview
  Optimizes the "Admins can view all profiles" policy to use (SELECT auth.uid()) pattern.
  
  ## Multiple Permissive Policies - Intentional Design
  The profiles table has 2 SELECT policies which is intentional:
  1. "Users can view own profile" - Users see their own profile
  2. "Admins can view all profiles" - Admins see ALL profiles
  
  These are combined with OR logic (permissive), allowing:
  - Regular users to see only their own profile
  - Admins to see all profiles
  
  This is correct design and not a conflict.

  ## Optimization
  Changed auth.uid() to (SELECT auth.uid()) for better performance.
*/

-- Drop and recreate the admin policy with optimization
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Policy Optimization Complete';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✓ Optimized admin profile policy';
  RAISE NOTICE '✓ Multiple permissive policies are intentional (not a conflict)';
  RAISE NOTICE '✓ Auth function calls now optimized';
  RAISE NOTICE '========================================================';
END $$;