/*
  # Add Purchase Price Column to Products Table

  ## Problem
  PostgREST error: 'Could not find the purchase_price column of products in the schema cache'
  The products table is missing the purchase_price column needed to track cost of goods.

  ## Solution
  Add purchase_price column to products table with appropriate defaults and constraints.

  ## Changes

  1. **Add Column**
     - `purchase_price` (numeric) - Cost price of the product (what we pay suppliers)
     - Default value: 0
     - NOT NULL constraint for data integrity

  2. **Purpose**
     - Track cost of goods sold (COGS)
     - Calculate profit margins (unit_price - purchase_price)
     - Update purchase price when purchase invoices are accepted
     - Essential for inventory valuation and financial reporting

  ## Schema Cache
  PostgREST will automatically refresh its schema cache when this migration is applied.
  No manual NOTIFY or reload is needed - the migration system handles this.

  ## Example Usage
  - When creating products: Set initial purchase_price
  - When accepting purchase invoices: Update purchase_price from invoice line items
  - Profit calculation: unit_price - purchase_price = gross profit per unit
*/

-- Add purchase_price column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE products ADD COLUMN purchase_price numeric DEFAULT 0 NOT NULL;
    
    -- Add comment for documentation
    COMMENT ON COLUMN products.purchase_price IS 'Cost price paid to suppliers for this product';
  END IF;
END $$;

-- Create an index for queries that filter by purchase price or calculate margins
CREATE INDEX IF NOT EXISTS idx_products_purchase_price ON products(purchase_price);

-- Update existing products to have a default purchase price if needed
-- This ensures data consistency for existing records
UPDATE products 
SET purchase_price = 0 
WHERE purchase_price IS NULL;