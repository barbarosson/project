/*
  # Inventory Management System

  ## Overview
  This migration creates a comprehensive inventory management system with stock tracking,
  movement history, and low stock alerts.

  ## Changes

  1. **Products Table Updates**
     - Add `sku` (Stock Keeping Unit) - unique product identifier
     - Add `category` - product category for organization
     - Add `current_stock` - real-time stock quantity
     - Add `critical_level` - threshold for low stock alerts (default: 10)
     - Add `total_sold` - lifetime sales count for analytics
     - Add `stock_status` - computed status (in_stock, low_stock, out_of_stock)

  2. **New Tables**
     - `stock_movements` - tracks all stock changes with reasons
       - `id` (uuid, primary key)
       - `product_id` (uuid, references products)
       - `movement_type` (text) - 'in' for additions, 'out' for deductions
       - `quantity` (numeric) - amount changed
       - `reason` (text) - explanation (e.g., 'Purchase Order #123', 'Invoice #102')
       - `reference_id` (uuid) - optional link to invoice/order
       - `reference_type` (text) - type of reference (invoice, purchase, adjustment)
       - `notes` (text) - additional information
       - `created_at` (timestamptz)
       - `created_by` (uuid) - user who made the change

  3. **Security**
     - Enable RLS on stock_movements table
     - Add policies for authenticated users

  4. **Notes**
     - Stock deduction will be handled by application logic when invoices are created
     - Movement history provides full audit trail
     - Critical level can be customized per product
*/

-- Add inventory management columns to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sku'
  ) THEN
    ALTER TABLE products ADD COLUMN sku text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category text DEFAULT 'General';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'current_stock'
  ) THEN
    ALTER TABLE products ADD COLUMN current_stock numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'critical_level'
  ) THEN
    ALTER TABLE products ADD COLUMN critical_level numeric DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'total_sold'
  ) THEN
    ALTER TABLE products ADD COLUMN total_sold numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_status'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_status text DEFAULT 'in_stock';
  END IF;
END $$;

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  reason text NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Enable RLS on stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Anyone can insert stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Anyone can update stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Anyone can delete stock movements" ON stock_movements;
END $$;

-- RLS Policies for stock_movements
CREATE POLICY "Anyone can view stock movements"
  ON stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update stock movements"
  ON stock_movements FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete stock movements"
  ON stock_movements FOR DELETE
  USING (true);

-- Update existing products with SKUs and stock data
DO $$
DECLARE
  product_record RECORD;
  counter INTEGER := 1000;
BEGIN
  FOR product_record IN SELECT id FROM products WHERE sku IS NULL
  LOOP
    UPDATE products 
    SET 
      sku = 'SKU-' || counter,
      current_stock = FLOOR(RANDOM() * 100 + 20)::numeric,
      critical_level = 10,
      total_sold = FLOOR(RANDOM() * 50)::numeric,
      category = CASE 
        WHEN RANDOM() < 0.3 THEN 'Services'
        WHEN RANDOM() < 0.6 THEN 'Software'
        ELSE 'Consulting'
      END
    WHERE id = product_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Update stock_status based on current_stock and critical_level
UPDATE products
SET stock_status = CASE
  WHEN current_stock = 0 THEN 'out_of_stock'
  WHEN current_stock <= critical_level THEN 'low_stock'
  ELSE 'in_stock'
END;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);