/*
  # Add total column to invoices table
  
  1. Changes
    - Add `total` column to invoices table as alias for amount
    - This ensures compatibility with code expecting 'total' field
*/

-- Add total column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'total'
  ) THEN
    ALTER TABLE invoices ADD COLUMN total numeric DEFAULT 0;
    
    -- Copy values from amount to total for existing records
    UPDATE invoices SET total = amount WHERE total IS NULL OR total = 0;
  END IF;
END $$;
