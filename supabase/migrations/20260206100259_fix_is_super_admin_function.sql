/*
  # Fix is_super_admin() function

  1. Changes
    - Updated `is_super_admin()` to check the `profiles.role` column instead of a hardcoded email
    - Now any user with `super_admin` role in the profiles table is recognized as super admin

  2. Security
    - Function uses SECURITY DEFINER with explicit search_path to prevent manipulation
    - Checks authenticated user's role from the profiles table
*/

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );
END;
$$;
