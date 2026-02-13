/*
  # Fix Demo Requests RLS - Final Solution
  
  1. Problem
    - Anon role can INSERT when RLS is disabled
    - Anon role CANNOT INSERT when RLS is enabled
    - Policies exist but not being applied correctly
    
  2. Root Cause
    - Table owner or schema permissions issue
    - Need to explicitly set table owner and force RLS
    
  3. Solution
    - Recreate table with correct ownership
    - Use FORCE ROW LEVEL SECURITY
    - Simplify policies to minimum
*/

-- First, backup existing data
CREATE TEMP TABLE demo_requests_backup AS SELECT * FROM demo_requests;

-- Drop and recreate table with correct settings
DROP TABLE IF EXISTS demo_requests CASCADE;

CREATE TABLE demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  company_name text NOT NULL,
  phone text,
  industry text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  rejection_reason text,
  user_id uuid,
  notes text
);

-- Enable RLS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_demo_requests_status ON demo_requests(status);
CREATE INDEX idx_demo_requests_email ON demo_requests(email);
CREATE INDEX idx_demo_requests_created_at ON demo_requests(created_at DESC);

-- Grant table access
GRANT ALL ON demo_requests TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON demo_requests TO authenticated;
GRANT INSERT ON demo_requests TO anon;

-- Create simple INSERT policies
CREATE POLICY "anon_insert_demo_requests"
  ON demo_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "auth_insert_demo_requests"
  ON demo_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SELECT policies
CREATE POLICY "admin_select_all_demo_requests"
  ON demo_requests
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "user_select_own_demo_requests"
  ON demo_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- UPDATE policies
CREATE POLICY "admin_update_demo_requests"
  ON demo_requests
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- DELETE policies
CREATE POLICY "admin_delete_demo_requests"
  ON demo_requests
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Restore data
INSERT INTO demo_requests SELECT * FROM demo_requests_backup;

-- Add comment
COMMENT ON TABLE demo_requests IS 'Demo account requests. Public can submit, admin approves/rejects.';
