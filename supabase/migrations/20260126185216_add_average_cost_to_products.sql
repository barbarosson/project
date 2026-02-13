/*
  # Add Average Cost Tracking to Products

  ## Overview
  This migration adds average cost calculation for products based on their
  stock movement history. This enables proper inventory valuation using
  weighted average costing method.

  ## Changes

  1. **Products Table**
     - Add `average_cost` (numeric) - weighted average cost per unit
     - Calculated from stock movements with unit costs
     - Used for inventory valuation and profitability analysis

  2. **Function**
     - Create function to calculate and update average cost
     - Can be called manually or triggered by stock movements

  3. **Notes**
     - Average cost is calculated from all 'in' movements with unit_cost > 0
     - Formula: Sum(quantity * unit_cost) / Sum(quantity)
     - Provides accurate cost basis for inventory
*/

-- Add average_cost column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'average_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN average_cost numeric DEFAULT 0;
  END IF;
END $$;

-- Create function to calculate average cost for a product
CREATE OR REPLACE FUNCTION calculate_product_average_cost(p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cost numeric;
  v_total_quantity numeric;
  v_average numeric;
BEGIN
  -- Calculate weighted average from stock movements
  SELECT 
    COALESCE(SUM(quantity * unit_cost), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total_cost, v_total_quantity
  FROM stock_movements
  WHERE product_id = p_product_id
    AND movement_type = 'in'
    AND unit_cost > 0;
  
  -- Calculate average (avoid division by zero)
  IF v_total_quantity > 0 THEN
    v_average := v_total_cost / v_total_quantity;
  ELSE
    v_average := 0;
  END IF;
  
  RETURN v_average;
END;
$$;

-- Update existing products with calculated average cost
DO $$
DECLARE
  product_record RECORD;
  avg_cost numeric;
BEGIN
  FOR product_record IN SELECT id FROM products
  LOOP
    avg_cost := calculate_product_average_cost(product_record.id);
    UPDATE products SET average_cost = avg_cost WHERE id = product_record.id;
  END LOOP;
END $$;

-- Add index for average_cost queries
CREATE INDEX IF NOT EXISTS idx_products_average_cost ON products(average_cost);
