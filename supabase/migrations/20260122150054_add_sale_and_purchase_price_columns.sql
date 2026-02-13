/*
  # Add Sale Price and Purchase Price to Products Table

  ## Overview
  This migration adds proper pricing columns to the products table to support:
  - sale_price: The price at which we sell products to customers
  - purchase_price: The cost price we pay to suppliers

  ## Changes

  1. **New Columns**
     - `sale_price` (numeric) - Sales price for customers (replaces unit_price concept)
     - `purchase_price` (numeric) - Cost price from suppliers
     - Both columns default to 0 and are NOT NULL for data integrity

  2. **Data Migration**
     - Copy existing unit_price values to sale_price for backward compatibility
     - Set purchase_price to 0 for existing products (can be updated later)

  3. **Indexing**
     - Add indexes for performance on price-related queries

  ## Purpose
  - Track cost of goods sold (COGS)
  - Calculate profit margins (sale_price - purchase_price)
  - Support purchase invoice integration
  - Enable proper inventory valuation
*/

-- Add sale_price column (replaces unit_price for selling price)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_price numeric DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN products.sale_price IS 'Price at which we sell this product to customers';
  END IF;
END $$;

-- Add purchase_price column (cost from suppliers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE products ADD COLUMN purchase_price numeric DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN products.purchase_price IS 'Cost price paid to suppliers for this product';
  END IF;
END $$;

-- Migrate existing data: if products have a unit_price column, copy it to sale_price
-- This ensures backward compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit_price'
  ) THEN
    UPDATE products 
    SET sale_price = COALESCE(unit_price, 0)
    WHERE sale_price = 0;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(sale_price);
CREATE INDEX IF NOT EXISTS idx_products_purchase_price ON products(purchase_price);

-- Ensure all existing products have valid prices
UPDATE products 
SET sale_price = 0 
WHERE sale_price IS NULL;

UPDATE products 
SET purchase_price = 0 
WHERE purchase_price IS NULL;
