/*
  # Add Extended Customer Fields
  
  1. Payment Terms
    - `payment_terms` (integer) - Payment due in X days (e.g., 30, 60, 90)
    - `payment_terms_type` (text) - Type of payment terms (net, eom, days)
  
  2. Detailed Address Information
    - `city` (text) - City/Province
    - `district` (text) - District
    - `postal_code` (text) - Postal/ZIP code
    - `country` (text) - Country, default 'Turkey'
  
  3. Bank Information
    - `bank_name` (text) - Bank name
    - `bank_account_holder` (text) - Account holder name
    - `bank_account_number` (text) - Bank account number
    - `bank_iban` (text) - IBAN number
    - `bank_branch` (text) - Bank branch name/code
    - `bank_swift` (text) - SWIFT/BIC code
  
  4. Additional Business Fields
    - `website` (text) - Company website
    - `industry` (text) - Industry/sector
    - `notes` (text) - Internal notes about customer
*/

-- Add payment terms columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE customers ADD COLUMN payment_terms integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'payment_terms_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN payment_terms_type text DEFAULT 'net';
  END IF;
END $$;

-- Add detailed address columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'city'
  ) THEN
    ALTER TABLE customers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'district'
  ) THEN
    ALTER TABLE customers ADD COLUMN district text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text DEFAULT 'Turkey';
  END IF;
END $$;

-- Add bank information columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_account_holder'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_account_holder text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_account_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_iban'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_iban text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_branch'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_branch text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'bank_swift'
  ) THEN
    ALTER TABLE customers ADD COLUMN bank_swift text;
  END IF;
END $$;

-- Add additional business fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'website'
  ) THEN
    ALTER TABLE customers ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'industry'
  ) THEN
    ALTER TABLE customers ADD COLUMN industry text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE customers ADD COLUMN notes text;
  END IF;
END $$;

-- Create index for city searches
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city) WHERE city IS NOT NULL;

-- Create index for payment terms
CREATE INDEX IF NOT EXISTS idx_customers_payment_terms ON customers(payment_terms) WHERE payment_terms IS NOT NULL;