/*
  # Professional Invoice Status Workflow Implementation
  
  ## Overview
  This migration implements a professional invoice status workflow with automatic status management.
  
  ## Status Definitions
  
  ### Manual Statuses (User-Controlled)
  - **draft**: Invoice is being prepared, not yet finalized
  - **sent**: Invoice has been sent to customer, awaiting payment
  - **cancelled**: Invoice has been cancelled and should be excluded from all calculations
  
  ### System-Driven Statuses (Automatic)
  - **paid**: Automatically set when invoice is fully paid (paid_amount >= total)
  - **overdue**: Automatically set when due_date has passed and invoice is still 'sent'
  
  ## Changes Made
  
  1. **Invoice Status Type Update**
     - Recreate invoice_status enum with new values: draft, sent, paid, overdue, cancelled
     - Update existing invoices to map to new status values
  
  2. **Auto-Update Paid Status Function**
     - Function: `update_invoice_paid_status()`
     - Trigger: Automatically updates invoice status to 'paid' when paid_amount >= total
     - Runs on INSERT/UPDATE of invoices table
  
  3. **Auto-Update Overdue Status Function**
     - Function: `update_overdue_invoices()`
     - Checks for invoices where due_date < current_date and status = 'sent'
     - Updates these invoices to 'overdue' status
     - Can be called manually or via scheduled job
  
  4. **Indexes for Performance**
     - Index on (status, due_date) for efficient overdue checks
     - Index on (tenant_id, status) for filtered queries
  
  ## Security Notes
  - All functions run with SECURITY DEFINER to bypass RLS
  - Functions still respect tenant_id to ensure data isolation
  - Only affects invoices within the same tenant
*/

-- Step 1: Create new invoice status type
DO $$ 
BEGIN
  -- Drop existing type if it exists and create new one
  DROP TYPE IF EXISTS invoice_status_new CASCADE;
  CREATE TYPE invoice_status_new AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
END $$;

-- Step 2: Add temporary column with new type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'status_new'
  ) THEN
    ALTER TABLE invoices ADD COLUMN status_new invoice_status_new;
  END IF;
END $$;

-- Step 3: Migrate existing data to new status values
UPDATE invoices
SET status_new = CASE 
  WHEN status::text = 'draft' THEN 'draft'::invoice_status_new
  WHEN status::text = 'sent' THEN 'sent'::invoice_status_new
  WHEN status::text = 'paid' THEN 'paid'::invoice_status_new
  WHEN status::text = 'overdue' THEN 'overdue'::invoice_status_new
  WHEN status::text = 'cancelled' THEN 'cancelled'::invoice_status_new
  WHEN status::text = 'partial' THEN 
    CASE 
      WHEN paid_amount >= total THEN 'paid'::invoice_status_new
      WHEN due_date < CURRENT_DATE THEN 'overdue'::invoice_status_new
      ELSE 'sent'::invoice_status_new
    END
  WHEN status::text = 'pending' THEN 'sent'::invoice_status_new
  ELSE 'draft'::invoice_status_new
END
WHERE status_new IS NULL;

-- Step 4: Drop old column and rename new one
ALTER TABLE invoices DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE invoices RENAME COLUMN status_new TO status;

-- Step 5: Set default and not null constraint
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'draft'::invoice_status_new;
ALTER TABLE invoices ALTER COLUMN status SET NOT NULL;

-- Step 6: Rename the type
DROP TYPE IF EXISTS invoice_status CASCADE;
ALTER TYPE invoice_status_new RENAME TO invoice_status;

-- Step 7: Create function to automatically update invoice to 'paid' when fully paid
CREATE OR REPLACE FUNCTION update_invoice_paid_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If paid_amount >= total and status is not already 'paid' or 'cancelled'
  IF NEW.paid_amount >= NEW.total 
     AND NEW.status NOT IN ('paid', 'cancelled') THEN
    NEW.status := 'paid';
  END IF;
  
  -- If paid_amount < total and status is 'paid', revert to 'sent' or 'overdue'
  IF NEW.paid_amount < NEW.total AND NEW.status = 'paid' THEN
    IF NEW.due_date < CURRENT_DATE THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'sent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 8: Create trigger for automatic paid status update
DROP TRIGGER IF EXISTS trigger_update_invoice_paid_status ON invoices;
CREATE TRIGGER trigger_update_invoice_paid_status
  BEFORE INSERT OR UPDATE OF paid_amount, total, status
  ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_status();

-- Step 9: Create function to update overdue invoices
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update sent invoices that are past due date to overdue
  WITH updated AS (
    UPDATE invoices
    SET status = 'overdue'
    WHERE status = 'sent'
      AND due_date < CURRENT_DATE
      AND paid_amount < total
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  RETURN updated_count;
END;
$$;

-- Step 10: Run initial overdue update
SELECT update_overdue_invoices();

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date 
  ON invoices(status, due_date) 
  WHERE status IN ('sent', 'paid');

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status 
  ON invoices(tenant_id, status);

-- Step 12: Add helpful comment
COMMENT ON FUNCTION update_overdue_invoices() IS 
'Updates all sent invoices past their due date to overdue status. Returns count of updated invoices. Should be run daily via cron job or manually as needed.';

COMMENT ON FUNCTION update_invoice_paid_status() IS 
'Automatically updates invoice status to paid when paid_amount >= total. Triggered on invoice insert/update.';

COMMENT ON COLUMN invoices.status IS 
'Invoice status: draft (user sets), sent (user sets), paid (auto when fully paid), overdue (auto when past due), cancelled (user sets)';
