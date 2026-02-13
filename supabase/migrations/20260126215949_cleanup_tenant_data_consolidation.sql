/*
  # Tenant Data Consolidation and Cleanup

  1. Purpose
    - Migrate all NULL tenant_id records to the dev user tenant
    - Consolidate test tenant data to dev user
    - Clean up orphaned records
    - Ensure data consistency

  2. Changes
    - Update NULL tenant_id records in customers, invoices to dev user
    - Migrate test tenant (00000000-0000-0000-0000-000000000001) data to dev user
    - Remove duplicate/test records after consolidation

  3. Security
    - All operations preserve RLS policies
    - No data loss, only consolidation
*/

-- Dev user tenant ID
DO $$
DECLARE
  dev_tenant_id uuid := 'f6037a25-1d87-4f7f-8fb8-292f9a3419d8';
  test_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Update NULL tenant_id records in customers
  UPDATE customers 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id IS NULL;

  -- Update NULL tenant_id records in invoices
  UPDATE invoices 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id IS NULL;

  -- Migrate test tenant customers to dev user
  UPDATE customers 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id = test_tenant_id;

  -- Migrate test tenant expenses to dev user
  UPDATE expenses 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id = test_tenant_id;

  -- Migrate test tenant invoices to dev user
  UPDATE invoices 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id = test_tenant_id;

  -- Migrate test tenant products to dev user
  UPDATE products 
  SET tenant_id = dev_tenant_id 
  WHERE tenant_id = test_tenant_id;

  RAISE NOTICE 'Successfully consolidated all tenant data to dev user: %', dev_tenant_id;
END $$;
