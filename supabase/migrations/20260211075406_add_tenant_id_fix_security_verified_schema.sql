/*
  # Add Tenant ID and Fix Security - Critical Tables

  ## CRITICAL SECURITY FIX
  Addresses severe security vulnerabilities:
  - customers, invoices, inventory, transactions lack tenant isolation
  - Public access policies allow unrestricted data access across tenants
  - Any user can read/modify data from ANY tenant
  
  ## Changes
  1. Add tenant_id columns to critical tables
  2. Backfill with default tenant
  3. Add constraints and indexes
  4. Remove dangerous public access policies
  5. Add proper tenant-based RLS policies with optimized auth calls

  ## Data Safety
  - Existing data preserved
  - Assigned to first available tenant or creates default
  - Constraints added after data migration
*/

-- ============================================================================
-- Step 1: Add tenant_id columns (nullable for safe migration)
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- ============================================================================
-- Step 2: Backfill with default tenant
-- ============================================================================

DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Get first available tenant or create one
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
  
  IF default_tenant_id IS NULL THEN
    -- Create a default tenant if none exist
    INSERT INTO tenants (name, created_at, updated_at)
    VALUES ('Default Tenant', now(), now())
    RETURNING id INTO default_tenant_id;
    
    RAISE NOTICE 'Created default tenant: %', default_tenant_id;
  ELSE
    RAISE NOTICE 'Using existing tenant: %', default_tenant_id;
  END IF;
  
  -- Backfill all tables
  UPDATE customers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE invoices SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE inventory SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE transactions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Backfilled tenant_id for all existing records';
END $$;

-- ============================================================================
-- Step 2.5: Ensure every tenant_id in use exists in tenants (fix orphan FKs)
-- ============================================================================
DO $$
DECLARE
  first_owner_id uuid;
BEGIN
  SELECT owner_id INTO first_owner_id FROM tenants LIMIT 1;
  IF first_owner_id IS NOT NULL THEN
    INSERT INTO tenants (id, name, owner_id, created_at, updated_at)
    SELECT d.tid, 'Legacy Tenant', first_owner_id, now(), now()
    FROM (
      SELECT DISTINCT tenant_id AS tid FROM customers WHERE tenant_id IS NOT NULL
      UNION
      SELECT DISTINCT tenant_id FROM invoices WHERE tenant_id IS NOT NULL
      UNION
      SELECT DISTINCT tenant_id FROM inventory WHERE tenant_id IS NOT NULL
      UNION
      SELECT DISTINCT tenant_id FROM transactions WHERE tenant_id IS NOT NULL
    ) d
    WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = d.tid);
  END IF;
END $$;

-- ============================================================================
-- Step 3: Add constraints and indexes
-- ============================================================================

-- Make tenant_id NOT NULL
ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_tenant_id_fkey'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_tenant_id_fkey'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_tenant_id_fkey'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT inventory_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_fkey'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);

-- ============================================================================
-- Step 4: CRITICAL - Remove dangerous public access policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow public to update customers" ON customers;
DROP POLICY IF EXISTS "Allow public to delete customers" ON customers;

DROP POLICY IF EXISTS "Allow public to view invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public to delete invoices" ON invoices;

DROP POLICY IF EXISTS "Allow public to view inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public to delete inventory" ON inventory;

DROP POLICY IF EXISTS "Allow public to view transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to update transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public to delete transactions" ON transactions;

-- ============================================================================
-- Step 5: Add secure tenant-based RLS policies
-- ============================================================================

-- customers
DROP POLICY IF EXISTS "Users can view own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can update own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own tenant customers" ON customers;
CREATE POLICY "Users can view own tenant customers"
  ON customers FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can insert own tenant customers"
  ON customers FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can update own tenant customers"
  ON customers FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can delete own tenant customers"
  ON customers FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

-- invoices
DROP POLICY IF EXISTS "Users can view own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own tenant invoices" ON invoices;
CREATE POLICY "Users can view own tenant invoices"
  ON invoices FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can insert own tenant invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can update own tenant invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can delete own tenant invoices"
  ON invoices FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

-- inventory
DROP POLICY IF EXISTS "Users can view own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can insert own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can delete own tenant inventory" ON inventory;
CREATE POLICY "Users can view own tenant inventory"
  ON inventory FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can insert own tenant inventory"
  ON inventory FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can update own tenant inventory"
  ON inventory FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can delete own tenant inventory"
  ON inventory FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

-- transactions
DROP POLICY IF EXISTS "Users can view own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own tenant transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own tenant transactions" ON transactions;
CREATE POLICY "Users can view own tenant transactions"
  ON transactions FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can insert own tenant transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can update own tenant transactions"
  ON transactions FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Users can delete own tenant transactions"
  ON transactions FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())));

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'CRITICAL SECURITY FIXES COMPLETED';
  RAISE NOTICE '========================================================';
  RAISE NOTICE '✓ Added tenant_id columns to 4 critical tables';
  RAISE NOTICE '✓ Removed DANGEROUS public access policies';
  RAISE NOTICE '✓ Implemented secure tenant isolation';
  RAISE NOTICE '✓ Added foreign key constraints for data integrity';
  RAISE NOTICE '✓ Created indexes for performance';
  RAISE NOTICE '✓ RLS policies use optimized (SELECT auth.uid()) pattern';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Tables secured: customers, invoices, inventory, transactions';
  RAISE NOTICE '========================================================';
END $$;
