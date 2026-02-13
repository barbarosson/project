/*
  # Add min_stock_level column to products table

  1. Changes
    - Add `min_stock_level` column to products table
    - Sync data from existing `critical_level` column
    - Set default value to 10
  
  2. Notes
    - This column is used by the application to track minimum stock thresholds
    - Synced with the existing `critical_level` column for backward compatibility
    - Both columns will be maintained for transition period
*/

-- Add min_stock_level column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'min_stock_level'
  ) THEN
    ALTER TABLE products ADD COLUMN min_stock_level NUMERIC DEFAULT 10 NOT NULL;
    
    -- Sync with existing critical_level column
    UPDATE products 
    SET min_stock_level = COALESCE(critical_level, 10) 
    WHERE min_stock_level = 10;
    
    COMMENT ON COLUMN products.min_stock_level IS 'Minimum stock level threshold for low stock alerts';
  END IF;
END $$;
