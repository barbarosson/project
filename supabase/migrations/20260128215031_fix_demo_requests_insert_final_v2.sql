/*
  # Fix Demo Requests Anonymous Insert - Final Solution V2
  
  1. Problem
    - Anonymous users cannot insert despite policy existing
    - WITH CHECK (true) not working
    
  2. Solution
    - Drop and recreate INSERT policy with explicit column check
    - Grant schema usage to anon
    - Test with realistic conditions
    
  3. Security
    - Allow anonymous users to submit demo requests
    - Validate required fields in WITH CHECK
*/

-- Grant schema usage to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Public can submit demo requests" ON demo_requests;
DROP POLICY IF EXISTS "Anyone can submit demo requests" ON demo_requests;
DROP POLICY IF EXISTS "Allow anonymous demo request submissions" ON demo_requests;

-- Recreate INSERT policy with explicit checks
CREATE POLICY "Allow anonymous demo request submissions"
  ON demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL AND 
    email IS NOT NULL AND 
    company_name IS NOT NULL AND
    status = 'pending'
  );

-- Ensure anon has INSERT permission
GRANT INSERT ON demo_requests TO anon;
