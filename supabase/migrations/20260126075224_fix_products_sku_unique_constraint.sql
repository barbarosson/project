/*
  # Fix Products SKU Unique Constraint
  
  ## Problem
  - Current unique constraint on `sku` column is global
  - Causes 23505 errors when different tenants try to use same SKU
  - SKU should be unique per tenant, not globally
  
  ## Solution
  - Drop existing global unique constraint on `sku`
  - Add composite unique constraint on `(tenant_id, sku)`
  - This allows different tenants to use the same SKU values
  
  ## Changes
  1. Drop `products_sku_key` constraint
  2. Add `products_tenant_sku_unique` composite constraint
  
  ## Impact
  - SKU values will now be unique per tenant
  - Prevents cross-tenant SKU conflicts
  - Maintains data integrity within each tenant
*/

-- Drop the existing global unique constraint on sku
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_sku_key;

-- Add composite unique constraint on (tenant_id, sku)
-- This ensures SKU is unique per tenant, not globally
ALTER TABLE products 
ADD CONSTRAINT products_tenant_sku_unique UNIQUE (tenant_id, sku);

-- Add index for better query performance on SKU lookups within tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_sku 
ON products(tenant_id, sku);
