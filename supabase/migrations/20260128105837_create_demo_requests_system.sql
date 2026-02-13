/*
  # Create Demo Requests System
  
  1. Overview
    - Creates demo_requests table for managing demo account requests
    - Users submit demo requests through a form
    - Admin approves/rejects requests
    - Upon approval, user account is created with 10 sample records
  
  2. New Tables
    - `demo_requests`
      - `id` (uuid, primary key)
      - `full_name` (text) - Requester's full name
      - `email` (text, unique) - Requester's email
      - `company_name` (text) - Company name
      - `phone` (text, nullable) - Phone number
      - `industry` (text, nullable) - Industry/sector
      - `message` (text, nullable) - Additional message
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz, nullable)
      - `processed_by` (uuid, nullable) - Admin who processed
      - `rejection_reason` (text, nullable) - Reason if rejected
      - `user_id` (uuid, nullable) - Created user ID if approved
  
  3. Security
    - Enable RLS on demo_requests table
    - Public can insert (submit requests)
    - Super admin can view all and update
    - Users can view their own requests
*/

-- Create demo_requests table
CREATE TABLE IF NOT EXISTS demo_requests (
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);

-- Public can insert (submit demo requests)
CREATE POLICY "Anyone can submit demo requests"
  ON demo_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Super admin can view all
CREATE POLICY "Super admin can view all demo requests"
  ON demo_requests FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admin can update
CREATE POLICY "Super admin can update demo requests"
  ON demo_requests FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Super admin can delete
CREATE POLICY "Super admin can delete demo requests"
  ON demo_requests FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Users can view their own requests (after they become users)
CREATE POLICY "Users can view own demo requests"
  ON demo_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE demo_requests IS 'Demo account requests. Public can submit, admin approves/rejects.';
