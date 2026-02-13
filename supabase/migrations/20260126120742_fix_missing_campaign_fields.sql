/*
  # Fix Missing Campaign and Account Fields

  ## Changes
  1. Add missing budget and description to campaigns table
  2. Fix account type constraint to include credit_card
  3. Add missing account fields for credit cards
*/

-- Add missing fields to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'budget'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN budget numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'description'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN target_audience text;
  END IF;
END $$;

-- Fix accounts table type constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts 
ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('cash', 'bank', 'credit_card'));

-- Add credit card fields to accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'bank_branch'
  ) THEN
    ALTER TABLE accounts ADD COLUMN bank_branch text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'iban'
  ) THEN
    ALTER TABLE accounts ADD COLUMN iban text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'card_last_four'
  ) THEN
    ALTER TABLE accounts ADD COLUMN card_last_four text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'card_holder_name'
  ) THEN
    ALTER TABLE accounts ADD COLUMN card_holder_name text;
  END IF;
END $$;

COMMENT ON COLUMN campaigns.budget IS 'Campaign budget amount';
COMMENT ON COLUMN campaigns.description IS 'Detailed campaign description';
COMMENT ON COLUMN campaigns.target_audience IS 'Target audience description';
COMMENT ON COLUMN accounts.card_last_four IS 'Last 4 digits of credit card';
COMMENT ON COLUMN accounts.card_holder_name IS 'Name on credit card';
