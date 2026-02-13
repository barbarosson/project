/*
  # Rename old transactions table and create new finance schema

  1. Rename old transactions table to simple_transactions for backward compatibility
  2. Create new accounts table for bank and cash accounts
  3. Create new transactions table for proper financial tracking
  4. Set up triggers and functions for automatic balance updates
*/

-- Rename old transactions table
ALTER TABLE IF EXISTS transactions RENAME TO simple_transactions;

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank')),
  currency text NOT NULL DEFAULT 'TRY',
  opening_balance numeric(15, 2) NOT NULL DEFAULT 0,
  current_balance numeric(15, 2) NOT NULL DEFAULT 0,
  account_number text,
  bank_name text,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create financial transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  account_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount numeric(15, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference_type text CHECK (reference_type IN ('invoice', 'expense', 'transfer', 'other')),
  reference_id uuid,
  customer_id uuid,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  notes text,
  created_by text DEFAULT 'System',
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);

-- RLS Policies for accounts
DROP POLICY IF EXISTS "Users can view their tenant's accounts" ON accounts;
CREATE POLICY "Users can view their tenant's accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can insert their tenant's accounts" ON accounts;
CREATE POLICY "Users can insert their tenant's accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can update their tenant's accounts" ON accounts;
CREATE POLICY "Users can update their tenant's accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can delete their tenant's accounts" ON accounts;
CREATE POLICY "Users can delete their tenant's accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their tenant's transactions" ON transactions;
CREATE POLICY "Users can view their tenant's transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can insert their tenant's transactions" ON transactions;
CREATE POLICY "Users can insert their tenant's transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can update their tenant's transactions" ON transactions;
CREATE POLICY "Users can update their tenant's transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Users can delete their tenant's transactions" ON transactions;
CREATE POLICY "Users can delete their tenant's transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Function to initialize account current_balance to opening_balance
CREATE OR REPLACE FUNCTION initialize_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_balance := NEW.opening_balance;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize balance on account creation
DROP TRIGGER IF EXISTS trigger_initialize_account_balance ON accounts;
CREATE TRIGGER trigger_initialize_account_balance
  BEFORE INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_account_balance();

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.transaction_type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type = 'expense' THEN
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.transaction_type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.account_id;
    ELSE
      UPDATE accounts 
      SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
    END IF;
    
    -- Apply new transaction
    IF NEW.transaction_type = 'income' THEN
      UPDATE accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSE
      UPDATE accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update account balance
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Add comments
COMMENT ON TABLE accounts IS 'Bank and cash accounts for tracking money';
COMMENT ON TABLE transactions IS 'Financial transactions - income and expenses with proper accounting';
COMMENT ON COLUMN transactions.reference_type IS 'Links transaction to invoice, expense, or other entity';

-- Add columns to invoices to track payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN paid_amount numeric(15, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN remaining_amount numeric(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Add columns to expenses to track payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE expenses ADD COLUMN paid_amount numeric(15, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE expenses ADD COLUMN remaining_amount numeric(15, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'status'
  ) THEN
    ALTER TABLE expenses ADD COLUMN status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid'));
  END IF;
END $$;
