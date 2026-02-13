/*
  # Add UPDATE and DELETE RLS Policies

  1. Policy Updates
    - Add UPDATE policies for all tables to allow authenticated users to modify records
    - Add DELETE policies for all tables to allow authenticated users to delete records
    
  2. Security Notes
    - All policies require authentication
    - These policies enable full CRUD operations for the application
*/

-- Check if policies exist before creating them
DO $$
BEGIN
  -- Customers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Authenticated users can update customers') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Authenticated users can delete customers') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete customers" ON customers FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Authenticated users can update products') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Authenticated users can delete products') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Invoices
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Authenticated users can update invoices') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update invoices" ON invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Authenticated users can delete invoices') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete invoices" ON invoices FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Proposals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Authenticated users can update proposals') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update proposals" ON proposals FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Authenticated users can delete proposals') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete proposals" ON proposals FOR DELETE TO authenticated USING (true)';
  END IF;

  -- Campaigns
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Authenticated users can update campaigns') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update campaigns" ON campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Authenticated users can delete campaigns') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can delete campaigns" ON campaigns FOR DELETE TO authenticated USING (true)';
  END IF;
END $$;