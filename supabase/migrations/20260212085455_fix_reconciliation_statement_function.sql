/*
  # Fix generate_reconciliation_statement function

  1. Changes
    - Remove references to non-existent i.type column
    - Use invoices.total for debits (amounts owed by customer)
    - Use invoices.paid_amount for credits (payments received)
    - Also include transactions for complete picture
    
  2. Notes
    - invoices table has no 'type' column, only 'status' enum
    - This fixes "column i.type does not exist" error
*/

CREATE OR REPLACE FUNCTION generate_reconciliation_statement(
  customer_id_param uuid,
  start_date_param date,
  end_date_param date,
  tenant_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opening_balance_val numeric(15,2);
  total_debits_val numeric(15,2);
  total_credits_val numeric(15,2);
  closing_balance_val numeric(15,2);
  transaction_debits numeric(15,2);
  transaction_credits numeric(15,2);
  result jsonb;
BEGIN
  -- Opening balance: sum of all invoice totals minus paid amounts before start date
  SELECT COALESCE(SUM(COALESCE(i.total, i.amount, 0) - COALESCE(i.paid_amount, 0)), 0)
  INTO opening_balance_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date < start_date_param;

  -- Total debits: invoice totals in the period (what customer owes)
  SELECT COALESCE(SUM(COALESCE(i.total, i.amount, 0)), 0)
  INTO total_debits_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date >= start_date_param
    AND i.issue_date <= end_date_param;

  -- Total credits: payments received in the period
  SELECT COALESCE(SUM(COALESCE(i.paid_amount, 0)), 0)
  INTO total_credits_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date >= start_date_param
    AND i.issue_date <= end_date_param;

  -- Also include transactions
  SELECT 
    COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0)
  INTO transaction_debits, transaction_credits
  FROM transactions t
  WHERE t.customer_id = customer_id_param
    AND t.tenant_id = tenant_id_param
    AND t.transaction_date >= start_date_param
    AND t.transaction_date <= end_date_param;

  total_debits_val := total_debits_val + transaction_debits;
  total_credits_val := total_credits_val + transaction_credits;

  -- Closing balance
  closing_balance_val := opening_balance_val + total_debits_val - total_credits_val;

  -- Build result
  result := jsonb_build_object(
    'opening_balance', opening_balance_val,
    'total_debits', total_debits_val,
    'total_credits', total_credits_val,
    'closing_balance', closing_balance_val,
    'period_start', start_date_param,
    'period_end', end_date_param
  );

  RETURN result;
END;
$$;