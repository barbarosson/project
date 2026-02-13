/*
  # Add Foreign Key Indexes - Security & Performance Fix

  ## Overview
  This migration adds missing indexes on all foreign key columns to improve
  query performance and fix security warnings.

  ## Changes Made
  - Add indexes on foreign key columns for various tables
  - Remove unused indexes
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

-- Transactions Indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
  END IF;
END $$;

-- Remove unused index
DROP INDEX IF EXISTS idx_products_tenant_sku;