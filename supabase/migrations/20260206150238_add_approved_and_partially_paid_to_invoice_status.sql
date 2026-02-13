/*
  # Add missing invoice status values

  1. Changes
    - Add 'approved' value to `invoice_status` enum
    - Add 'partially_paid' value to `invoice_status` enum

  2. Reason
    - The e-document integration references 'approved' status (from NES API responses)
    - 'partially_paid' is needed for partial payment tracking
    - Current enum only has: draft, sent, paid, overdue, cancelled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
    AND enumlabel = 'approved'
  ) THEN
    ALTER TYPE invoice_status ADD VALUE 'approved';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
    AND enumlabel = 'partially_paid'
  ) THEN
    ALTER TYPE invoice_status ADD VALUE 'partially_paid';
  END IF;
END $$;
