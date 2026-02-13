/*
  # Fix Demo Requests Anonymous Insert Policy
  
  1. Problem
    - Anonymous users cannot insert into demo_requests table
    - RLS policy exists but not working
    - Error: "new row violates row-level security policy"
  
  2. Changes
    - Drop existing INSERT policy if exists
    - Recreate INSERT policy with explicit anon role
    - Grant necessary permissions to anon role
  
  3. Security
    - Allow anonymous users to submit demo requests (public form)
    - Only allow INSERT, no SELECT/UPDATE/DELETE for anonymous
    - Authenticated super admins can manage all requests
*/

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Anyone can submit demo requests" ON demo_requests;

-- Recreate INSERT policy for anonymous and authenticated users
CREATE POLICY "Public can submit demo requests"
  ON demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure anon role has INSERT permission on the table
GRANT INSERT ON demo_requests TO anon;

-- Add helpful comment
COMMENT ON POLICY "Public can submit demo requests" ON demo_requests 
  IS 'Allows anyone (anonymous or authenticated) to submit demo account requests through public forms';
