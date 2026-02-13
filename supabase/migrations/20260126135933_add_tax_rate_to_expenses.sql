/*
  # Add Tax Rate to Expenses
  
  1. Changes
    - Add `tax_rate` column to expenses table
    - Default to 20% (standard VAT rate in Turkey)
*/

-- Add tax_rate column to expenses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE expenses ADD COLUMN tax_rate numeric DEFAULT 20;
  END IF;
END $$;
