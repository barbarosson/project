/*
  # Fix Function Security Warnings
  
  ## Problem
  - Supabase reports function_search_path_mutable warnings
  - Functions need to have search_path set to 'public' only
  
  ## Solution
  - Update initialize_account_balance to set search_path = public
  - Update update_account_balance to set search_path = public
  
  ## Security
  - SECURITY DEFINER functions require explicit search_path
  - Setting to 'public' prevents schema injection attacks
*/

-- Drop and recreate initialize_account_balance with proper search_path
DROP FUNCTION IF EXISTS initialize_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION initialize_account_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.current_balance := NEW.opening_balance;
  RETURN NEW;
END;
$$;

-- Recreate trigger for initialize_account_balance
DROP TRIGGER IF EXISTS trigger_initialize_account_balance ON accounts;
CREATE TRIGGER trigger_initialize_account_balance
  BEFORE INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_account_balance();

-- Drop and recreate update_account_balance with proper search_path
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transaction_type = 'income' THEN
    UPDATE accounts 
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.account_id;
  ELSIF NEW.transaction_type = 'expense' THEN
    UPDATE accounts 
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for update_account_balance
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();
