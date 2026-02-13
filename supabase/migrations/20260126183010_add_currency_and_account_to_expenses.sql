/*
  # Add Currency and Account Support to Expenses

  1. Changes
    - Add `currency` column to expenses table (defaults to 'TRY')
    - Add `account_id` column to expenses table (nullable, for tracking which account was used)
    - Add foreign key constraint for account_id
    - Add index for account_id lookups

  2. Notes
    - Currency field allows tracking expenses in different currencies
    - Account field is optional but recommended for bank_transfer and credit_card payments
    - When account_id is set, the expense should be linked to a specific bank or cash account
*/

-- Add currency column to expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE expenses ADD COLUMN currency text NOT NULL DEFAULT 'TRY';
  END IF;
END $$;

-- Add account_id column to expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN account_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for account_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'expenses_account_id_fkey'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for account_id lookups
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(account_id);

-- Add comment to clarify usage
COMMENT ON COLUMN expenses.account_id IS 'The account (bank or cash) used for this expense. Should be set for bank_transfer and credit_card payments.';
COMMENT ON COLUMN expenses.currency IS 'Currency of the expense amount (e.g., TRY, USD, EUR)';
