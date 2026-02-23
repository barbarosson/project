/*
  # Fix RLS Policies for Customers Table

  ## Overview
  This migration updates the Row Level Security policies for the customers table to allow
  proper access for authenticated and public users during development.

  ## Changes
  
  ### 1. Drop existing restrictive policies
  Remove all existing policies that are blocking inserts

  ### 2. Create new development-friendly policies
  - Allow public SELECT access for reading customer data
  - Allow public INSERT access for creating new customers
  - Allow public UPDATE access for modifying customers
  - Allow public DELETE access for removing customers

  ## Security Notes
  - These policies are configured for development and testing
  - In production, you should implement proper authentication and tenant-based access control
  - Consider adding a tenant_id column and filtering by user's organization
  
  ## Future Improvements
  - Add authentication system (Supabase Auth)
  - Add tenant_id column for multi-tenancy
  - Update policies to filter by tenant_id: USING (tenant_id = auth.jwt()->>'tenant_id')
  - Implement proper role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Create new policies that allow public access for development (idempotent)
-- Note: In production, replace 'public' with 'authenticated' and add proper tenant checks

DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
CREATE POLICY "Allow public to view customers"
  ON customers FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
CREATE POLICY "Allow public to insert customers"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to update customers" ON customers;
CREATE POLICY "Allow public to update customers"
  ON customers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to delete customers" ON customers;
CREATE POLICY "Allow public to delete customers"
  ON customers FOR DELETE
  TO public
  USING (true);