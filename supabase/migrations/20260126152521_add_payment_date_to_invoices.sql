/*
  # Add payment_date column to invoices table

  1. Changes
    - Add `payment_date` column to `invoices` table (timestamptz, nullable)
    - This column will store the actual date when payment was received
    - For paid invoices, this date should be used instead of issue_date for revenue calculations
  
  2. Notes
    - Column is nullable because unpaid invoices won't have a payment date
    - For historical data, payment_date can be updated manually or remain null
    - When an invoice is marked as paid, payment_date should be set
*/

-- Add payment_date column to invoices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_date timestamptz;
  END IF;
END $$;

-- Add index for payment_date to improve query performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_date ON invoices(payment_date) WHERE payment_date IS NOT NULL;

-- Add index for combined status and payment_date queries
CREATE INDEX IF NOT EXISTS idx_invoices_status_payment_date ON invoices(status, payment_date) WHERE status = 'paid';