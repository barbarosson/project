/*
  # Fix RLS Policies for Customers Table
  Replace authenticated policies with public policies for development
*/

DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;
DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow public to update customers" ON customers;
DROP POLICY IF EXISTS "Allow public to delete customers" ON customers;

CREATE POLICY "Allow public to view customers" ON customers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public to insert customers" ON customers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public to update customers" ON customers FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public to delete customers" ON customers FOR DELETE TO public USING (true);
