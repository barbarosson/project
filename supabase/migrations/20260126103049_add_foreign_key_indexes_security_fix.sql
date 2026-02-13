/*
  # Add Foreign Key Indexes - Security & Performance Fix

  ## Overview
  This migration adds missing indexes on all foreign key columns to improve
  query performance and fix security warnings. Foreign keys without indexes
  can cause severe performance degradation on JOIN operations and CASCADE operations.

  ## Changes Made

  ### 1. Invoice Line Items Table
    - Add index on `inventory_id` (FK to inventory)
    - Add index on `product_id` (FK to products)
    
  ### 2. Invoices Table
    - Add index on `customer_id` (FK to customers)
    
  ### 3. Proposal Line Items Table
    - Add index on `product_id` (FK to products)
    
  ### 4. Proposals Table
    - Add index on `customer_id` (FK to customers)
    
  ### 5. Purchase Invoice Line Items Table
    - Add index on `product_id` (FK to products)
    - Add index on `purchase_invoice_id` (FK to purchase_invoices)
    
  ### 6. Purchase Invoices Table
    - Add index on `supplier_id` (FK to customers)
    
  ### 7. Transactions Table
    - Add index on `account_id` (FK to accounts)
    - Add index on `customer_id` (FK to customers)
    
  ### 8. Cleanup
    - Remove unused index `idx_products_tenant_sku` (replaced by unique constraint)

  ## Performance Impact
  - These indexes will significantly improve JOIN performance
  - CASCADE DELETE/UPDATE operations will be faster
  - Foreign key constraint checks will be more efficient
  
  ## Notes
  - All indexes are created with IF NOT EXISTS to ensure idempotency
  - Indexes follow naming convention: idx_{table}_{column}
  - These indexes are critical for production performance
*/

-- Invoice Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id 
  ON invoice_line_items(inventory_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_product_id 
  ON invoice_line_items(product_id);

-- Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
  ON invoices(customer_id);

-- Proposal Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_product_id 
  ON proposal_line_items(product_id);

-- Proposals Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id 
  ON proposals(customer_id);

-- Purchase Invoice Line Items Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_product_id 
  ON purchase_invoice_line_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_purchase_invoice_id 
  ON purchase_invoice_line_items(purchase_invoice_id);

-- Purchase Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id 
  ON purchase_invoices(supplier_id);

-- Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_account_id 
  ON transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id 
  ON transactions(customer_id);

-- Remove unused index (products already has unique constraint on tenant_id + sku)
DROP INDEX IF EXISTS idx_products_tenant_sku;