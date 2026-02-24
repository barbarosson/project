/*
  # Fix RLS Policies for All Tables

  ## Overview
  This migration updates the Row Level Security policies for all ERP tables
  (inventory, invoices, transactions) to allow proper access during development.

  ## Changes
  
  ### 1. Update inventory table policies
  ### 2. Update invoices table policies
  ### 3. Update transactions table policies

  ## Security Notes
  - These policies are configured for development and testing
  - In production, implement proper authentication and tenant-based access control
*/

-- ============================================
-- INVENTORY TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to view inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to delete inventory" ON inventory;

CREATE POLICY "Allow public to view inventory"
  ON inventory FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert inventory"
  ON inventory FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update inventory"
  ON inventory FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete inventory"
  ON inventory FOR DELETE
  TO public
  USING (true);

-- ============================================
-- INVOICES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to view invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to delete invoices" ON invoices;

CREATE POLICY "Allow public to view invoices"
  ON invoices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert invoices"
  ON invoices FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update invoices"
  ON invoices FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete invoices"
  ON invoices FOR DELETE
  TO public
  USING (true);

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to view transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to update transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to delete transactions" ON transactions;

CREATE POLICY "Allow public to view transactions"
  ON transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert transactions"
  ON transactions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update transactions"
  ON transactions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete transactions"
  ON transactions FOR DELETE
  TO public
  USING (true);