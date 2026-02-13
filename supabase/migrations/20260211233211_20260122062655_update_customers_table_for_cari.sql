/*
  # Update Customers Table for Cari Management

  Adds Turkish business fields: account_type, tax_office, tax_number, balance, e_invoice_enabled, company_title
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_type') THEN
    ALTER TABLE customers ADD COLUMN account_type text DEFAULT 'customer' CHECK (account_type IN ('customer', 'vendor', 'both'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_office') THEN
    ALTER TABLE customers ADD COLUMN tax_office text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_number') THEN
    ALTER TABLE customers ADD COLUMN tax_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'balance') THEN
    ALTER TABLE customers ADD COLUMN balance numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'e_invoice_enabled') THEN
    ALTER TABLE customers ADD COLUMN e_invoice_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_title') THEN
    ALTER TABLE customers ADD COLUMN company_title text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_tax_number ON customers(tax_number);
