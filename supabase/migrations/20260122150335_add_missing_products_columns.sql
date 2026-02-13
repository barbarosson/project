/*
  # Add Missing Columns to Products Table

  ## Overview
  The products table needs additional columns to match the application schema:
  - status: Text field for product status (active/inactive) - more flexible than boolean
  - unit: Unit of measurement for the product

  ## Changes

  1. **New Columns**
     - `status` (text) - Product status: 'active' or 'inactive'
     - `unit` (text) - Unit of measurement: 'piece', 'kg', 'meter', 'liter', 'box', etc.

  2. **Data Migration**
     - Convert existing is_active boolean to status text field
     - Set default unit to 'piece' for existing products

  ## Notes
  - We keep is_active for backward compatibility but add status as the primary field
  - Default values ensure data integrity for existing records
*/

-- Add status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE products ADD COLUMN status text DEFAULT 'active' NOT NULL;
    COMMENT ON COLUMN products.status IS 'Product status: active or inactive';
    
    -- Migrate data from is_active to status if is_active column exists
    UPDATE products 
    SET status = CASE 
      WHEN is_active = true THEN 'active'
      WHEN is_active = false THEN 'inactive'
      ELSE 'active'
    END
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'is_active'
    );
  END IF;
END $$;

-- Add unit column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit text DEFAULT 'piece' NOT NULL;
    COMMENT ON COLUMN products.unit IS 'Unit of measurement: piece, kg, meter, liter, box, etc.';
  END IF;
END $$;

-- Ensure all existing products have valid values
UPDATE products 
SET status = 'active' 
WHERE status IS NULL OR status = '';

UPDATE products 
SET unit = 'piece' 
WHERE unit IS NULL OR unit = '';

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_status_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
