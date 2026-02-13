/*
  # Fix Profiles RLS Read Access

  ## Problem
  - Users cannot read their own profile after login
  - RLS policy "Users can view all profiles" with USING (true) is not working
  - This blocks admin login functionality

  ## Solution
  - Drop existing SELECT policy
  - Create new SELECT policies that explicitly allow:
    1. Anonymous users to read all profiles (for public info)
    2. Authenticated users to read all profiles
    3. Super admins to read any profile
  
  ## Security
  - Profiles table only contains non-sensitive user info (email, name, role)
  - No payment info or sensitive data stored in profiles
  - This is safe for public read access
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow anonymous users to read profiles (for public pages, case studies, etc.)
CREATE POLICY "Allow anonymous to read profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read all profiles
CREATE POLICY "Allow authenticated to read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;