/*
  # Fix Invoice Paid Amount Auto-Update

  1. Problem Fixed
    - When invoices are marked as 'paid', the paid_amount field remains 0
    - This causes dashboard metrics (Total Revenue, Collected Cash) to show incorrect values
    - Cash flow chart shows no income because paid_amount is always 0

  2. Solution
    - Create a trigger function that automatically updates paid_amount and remaining_amount
    - When status = 'paid': paid_amount = total, remaining_amount = 0
    - When status = 'draft' or 'sent': paid_amount = 0, remaining_amount = total
    - When status = 'overdue': paid_amount = COALESCE(paid_amount, 0), remaining_amount = total - paid_amount
    - When status = 'partially_paid': Calculate based on current paid_amount
    - When status = 'cancelled': paid_amount = 0, remaining_amount = 0

  3. Backfill
    - Update all existing invoices to have correct paid_amount and remaining_amount

  4. Impact
    - Dashboard will now show correct metrics
    - Cash flow chart will display actual income data
    - Collected cash metric will reflect real payments
*/

-- Create function to automatically update invoice payment amounts
CREATE OR REPLACE FUNCTION update_invoice_payment_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- When invoice is marked as paid, set paid_amount to total
  IF NEW.status = 'paid' THEN
    NEW.paid_amount := NEW.total;
    NEW.remaining_amount := 0;
  
  -- When invoice is draft or sent, no payment yet
  ELSIF NEW.status IN ('draft', 'sent') THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - COALESCE(NEW.paid_amount, 0);
  
  -- When invoice is overdue, keep current paid_amount
  ELSIF NEW.status = 'overdue' THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - NEW.paid_amount;
  
  -- When invoice is partially paid
  ELSIF NEW.status = 'partially_paid' THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - NEW.paid_amount;
  
  -- When invoice is cancelled
  ELSIF NEW.status = 'cancelled' THEN
    NEW.paid_amount := 0;
    NEW.remaining_amount := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_invoice_payment_amounts ON invoices;

-- Create trigger that runs before insert or update
CREATE TRIGGER trigger_update_invoice_payment_amounts
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_amounts();

-- Backfill existing invoices with correct amounts
UPDATE invoices
SET 
  paid_amount = CASE 
    WHEN status = 'paid' THEN total
    WHEN status = 'cancelled' THEN 0
    ELSE COALESCE(paid_amount, 0)
  END,
  remaining_amount = CASE 
    WHEN status = 'paid' THEN 0
    WHEN status = 'cancelled' THEN 0
    ELSE total - COALESCE(paid_amount, 0)
  END
WHERE paid_amount IS NULL OR remaining_amount IS NULL OR paid_amount = 0;
