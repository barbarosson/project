/*
  # Add Currency Support to Company Settings

  1. Changes
    - Add `currency` column to `company_settings` table
    - Set default currency to 'USD'
*/

-- Add currency column to company_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN currency text DEFAULT 'USD' NOT NULL;
  END IF;
END $$;

-- Update existing records to have USD as currency
UPDATE company_settings SET currency = 'USD' WHERE currency IS NULL OR currency = '';