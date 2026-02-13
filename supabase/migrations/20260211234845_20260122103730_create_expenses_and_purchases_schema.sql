/*
  # Expenses and Purchase Management Schema

  1. New Tables
    - `purchase_invoices` - Incoming invoices from suppliers
    - `purchase_invoice_line_items` - Line items for purchase invoices
    - `expenses` - Manual expense entries

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  rejection_reason text,
  xml_content text,
  html_preview text,
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, invoice_number)
);

-- Create purchase_invoice_line_items table
CREATE TABLE IF NOT EXISTS purchase_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  purchase_invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 18,
  tax_amount numeric(12, 2) NOT NULL,
  total numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'marketing', 'personnel', 'office', 'tax', 'utilities', 'rent', 'other')),
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'other')),
  receipt_url text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON purchase_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_tenant_id ON purchase_invoice_line_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_invoice_id ON purchase_invoice_line_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Enable Row Level Security
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'Users can view purchase invoices') THEN
    EXECUTE 'CREATE POLICY "Users can view purchase invoices" ON purchase_invoices FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'Users can insert purchase invoices') THEN
    EXECUTE 'CREATE POLICY "Users can insert purchase invoices" ON purchase_invoices FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view expenses') THEN
    EXECUTE 'CREATE POLICY "Users can view expenses" ON expenses FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert expenses') THEN
    EXECUTE 'CREATE POLICY "Users can insert expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoice_line_items' AND policyname = 'Users can view purchase invoice line items') THEN
    EXECUTE 'CREATE POLICY "Users can view purchase invoice line items" ON purchase_invoice_line_items FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;