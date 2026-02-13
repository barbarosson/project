/*
  # Create is_super_admin() Helper Function
  
  1. New Function
    - `is_super_admin()` - Checks if current user is super admin
      - Returns true if user email is 'admin@modulus.com'
      - Uses auth.jwt() to get email from JWT token
      - SECURITY DEFINER for elevated privileges
      - STABLE for performance (result doesn't change during query)
  
  2. Security
    - Function is SECURITY DEFINER to access auth.jwt()
    - Grants EXECUTE permission to authenticated users
    - Sets search_path to public for security
*/

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt()->>'email')::text = 'admin@modulus.com',
    false
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon;
