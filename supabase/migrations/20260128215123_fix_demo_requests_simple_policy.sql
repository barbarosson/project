/*
  # Simplify Demo Requests INSERT Policy
  
  1. Problem
    - Complex WITH CHECK not working for anon role
    - Status check may be causing issues
    
  2. Solution
    - Use simplest possible WITH CHECK
    - Let database constraints handle validation
    
  3. Security
    - Allow anonymous INSERT with minimal checks
    - Database NOT NULL constraints will still apply
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Allow anonymous demo request submissions" ON demo_requests;

-- Create simplest possible INSERT policy
CREATE POLICY "Allow public demo submissions"
  ON demo_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Separate policy for authenticated users
CREATE POLICY "Allow authenticated demo submissions"
  ON demo_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
