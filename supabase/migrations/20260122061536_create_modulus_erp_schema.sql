/*
  # Modulus ERP/CRM Database Schema

  ## Overview
  This migration creates the foundational tables for the Modulus ERP and CRM system,
  including customer management, inventory tracking, invoicing, and transaction history.

  ## New Tables

  ### 1. `customers`
  Customer relationship management table
  - `id` (uuid, primary key)
  - `name` (text) - Customer/company name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `address` (text) - Physical address
  - `status` (text) - active, inactive, pending
  - `total_revenue` (numeric) - Lifetime revenue from customer
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `inventory`
  Product and inventory management
  - `id` (uuid, primary key)
  - `name` (text) - Product name
  - `sku` (text) - Stock keeping unit
  - `category` (text) - Product category
  - `quantity` (integer) - Current stock level
  - `min_quantity` (integer) - Minimum stock threshold
  - `unit_price` (numeric) - Price per unit
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `invoices`
  Invoice tracking and management
  - `id` (uuid, primary key)
  - `customer_id` (uuid) - Reference to customers table
  - `invoice_number` (text) - Unique invoice identifier
  - `amount` (numeric) - Invoice total amount
  - `status` (text) - pending, paid, overdue, cancelled
  - `due_date` (date) - Payment due date
  - `paid_date` (date) - Actual payment date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `transactions`
  Financial transaction history for cash flow tracking
  - `id` (uuid, primary key)
  - `type` (text) - income, expense
  - `category` (text) - Transaction category
  - `amount` (numeric) - Transaction amount
  - `description` (text) - Transaction details
  - `date` (date) - Transaction date
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their organization's data
  
  ## Notes
  - All monetary values use numeric type for precision
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
  - Default values set for common fields
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  total_revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text,
  quantity integer DEFAULT 0,
  min_quantity integer DEFAULT 10,
  unit_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date NOT NULL,
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for customers (idempotent: drop if exists first)
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;
CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for inventory
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory;
CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON inventory;
CREATE POLICY "Authenticated users can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update inventory" ON inventory;
CREATE POLICY "Authenticated users can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON inventory;
CREATE POLICY "Authenticated users can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for invoices
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON invoices;
CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update invoices" ON invoices;
CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON invoices;
CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for transactions
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;
CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample data for demonstration

-- Sample customers
INSERT INTO customers (name, email, phone, status, total_revenue) VALUES
  ('Acme Corporation', 'contact@acme.com', '+1-555-0101', 'active', 125000),
  ('TechStart Inc', 'info@techstart.io', '+1-555-0102', 'active', 87500),
  ('Global Solutions Ltd', 'hello@globalsolutions.com', '+1-555-0103', 'active', 156000),
  ('Innovation Labs', 'team@innovationlabs.com', '+1-555-0104', 'pending', 0),
  ('Enterprise Systems', 'contact@enterprise.com', '+1-555-0105', 'active', 234000)
ON CONFLICT DO NOTHING;

-- Sample inventory (idempotent: skip if sku exists)
INSERT INTO inventory (name, sku, category, quantity, min_quantity, unit_price) VALUES
  ('Laptop Pro 15"', 'LPT-001', 'Electronics', 45, 10, 1299.99),
  ('Wireless Mouse', 'MSE-001', 'Electronics', 5, 20, 29.99),
  ('Office Chair Deluxe', 'CHR-001', 'Furniture', 25, 10, 399.99),
  ('Monitor 27" 4K', 'MON-001', 'Electronics', 8, 15, 549.99),
  ('USB-C Hub', 'HUB-001', 'Electronics', 120, 30, 49.99)
ON CONFLICT (sku) DO NOTHING;

-- Sample transactions for the last 6 months (only if table has original schema with "type" column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'type'
  ) THEN
    INSERT INTO transactions (type, category, amount, description, date) VALUES
      ('income', 'Sales', 45000, 'Q4 Product Sales', CURRENT_DATE - INTERVAL '1 month'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '1 month'),
      ('income', 'Sales', 52000, 'Q3 Product Sales', CURRENT_DATE - INTERVAL '2 months'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '2 months'),
      ('expense', 'Marketing', 8500, 'Ad Campaign', CURRENT_DATE - INTERVAL '2 months'),
      ('income', 'Sales', 38000, 'Product Sales', CURRENT_DATE - INTERVAL '3 months'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '3 months'),
      ('income', 'Sales', 61000, 'Product Sales', CURRENT_DATE - INTERVAL '4 months'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '4 months'),
      ('expense', 'Payroll', 35000, 'Monthly Salaries', CURRENT_DATE - INTERVAL '4 months'),
      ('income', 'Sales', 47000, 'Product Sales', CURRENT_DATE - INTERVAL '5 months'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '5 months'),
      ('income', 'Sales', 55000, 'Product Sales', CURRENT_DATE - INTERVAL '6 months'),
      ('expense', 'Operations', 12000, 'Office Rent', CURRENT_DATE - INTERVAL '6 months'),
      ('expense', 'Marketing', 15000, 'Conference Sponsorship', CURRENT_DATE - INTERVAL '6 months')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;