/*
  # Add Unit Cost to Stock Movements

  ## Overview
  This migration adds unit cost tracking to stock movements to properly calculate
  inventory costs and maintain cost history.

  ## Changes

  1. **Stock Movements Table**
     - Add `unit_cost` (numeric) - cost per unit for this movement
     - Allows tracking purchase price for each stock addition
     - Enables cost-based inventory valuation

  2. **Notes**
     - Unit cost is especially important for 'in' movements
     - Helps calculate total inventory value
     - Provides historical cost data for financial reporting
*/

-- Add unit_cost column to stock_movements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN unit_cost numeric DEFAULT 0;
  END IF;
END $$;

-- Add index for cost-based queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_unit_cost ON stock_movements(unit_cost);
