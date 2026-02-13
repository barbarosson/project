/*
  # Add Currency Support to Company Settings

  1. Changes
    - Add `currency` column to `company_settings` table
    - Set default currency to 'USD'
    - Update existing records to use USD as default

  2. Security
    - No RLS changes needed (inherits from table)
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
UPDATE company_settings SET currency = 'USD' WHERE currency IS NULL;

-- Add comment
COMMENT ON COLUMN company_settings.currency IS 'Currency code (TRY, USD, EUR, GBP, CHF, CAD, AUD, JPY, SAR, AED)';
