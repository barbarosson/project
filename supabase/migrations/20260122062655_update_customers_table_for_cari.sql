/*
  # Update Customers Table for Cari Management

  ## Overview
  This migration enhances the customers table to support comprehensive customer/vendor (Cari) management
  with Turkish business requirements including tax information and e-invoice integration.

  ## Changes to `customers` table

  ### New Columns Added
  - `account_type` (text) - Customer, Vendor, or Both
  - `tax_office` (text) - Tax office name (Vergi Dairesi)
  - `tax_number` (text) - Tax identification number (VKN/TCKN)
  - `balance` (numeric) - Current account balance
  - `e_invoice_enabled` (boolean) - E-Invoice integration status
  - `company_title` (text) - Official company title

  ## Notes
  - All new fields are optional to maintain backwards compatibility
  - Default values set for common fields
  - Tax number should be unique when provided
  - Balance defaults to 0
*/

-- Add new columns to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN account_type text DEFAULT 'customer' CHECK (account_type IN ('customer', 'vendor', 'both'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tax_office'
  ) THEN
    ALTER TABLE customers ADD COLUMN tax_office text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tax_number'
  ) THEN
    ALTER TABLE customers ADD COLUMN tax_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'balance'
  ) THEN
    ALTER TABLE customers ADD COLUMN balance numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'e_invoice_enabled'
  ) THEN
    ALTER TABLE customers ADD COLUMN e_invoice_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_title'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_title text;
  END IF;
END $$;

-- Create index on tax_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_tax_number ON customers(tax_number);

-- Update existing sample data
UPDATE customers SET
  account_type = 'customer',
  tax_office = 'Kadıköy Vergi Dairesi',
  tax_number = '1234567890',
  balance = 15000,
  e_invoice_enabled = true,
  company_title = name
WHERE name = 'Acme Corporation';

UPDATE customers SET
  account_type = 'customer',
  tax_office = 'Beşiktaş Vergi Dairesi',
  tax_number = '2345678901',
  balance = -5000,
  e_invoice_enabled = true,
  company_title = name
WHERE name = 'TechStart Inc';

UPDATE customers SET
  account_type = 'both',
  tax_office = 'Şişli Vergi Dairesi',
  tax_number = '3456789012',
  balance = 8500,
  e_invoice_enabled = false,
  company_title = name
WHERE name = 'Global Solutions Ltd';

UPDATE customers SET
  account_type = 'vendor',
  tax_office = 'Üsküdar Vergi Dairesi',
  tax_number = '4567890123',
  balance = 0,
  e_invoice_enabled = false,
  company_title = name
WHERE name = 'Innovation Labs';

UPDATE customers SET
  account_type = 'customer',
  tax_office = 'Levent Vergi Dairesi',
  tax_number = '5678901234',
  balance = 25000,
  e_invoice_enabled = true,
  company_title = name
WHERE name = 'Enterprise Systems';