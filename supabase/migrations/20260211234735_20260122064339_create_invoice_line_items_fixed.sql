/*
  # Create Invoice Line Items Table

  ## Overview
  This migration creates the invoice_line_items table to support detailed invoicing
  with multiple products/services per invoice, including VAT calculations.

  ## New Table

  ### `invoice_line_items`
  Stores individual line items for each invoice

  ## Security
  - Enable RLS on invoice_line_items table
  - Add policies for public access (development mode)
*/

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 20,
  line_total numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_with_vat numeric NOT NULL DEFAULT 0,
  inventory_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to invoices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE invoices ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'total_vat'
  ) THEN
    ALTER TABLE invoices ADD COLUMN total_vat numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN issue_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'notes'
  ) THEN
    ALTER TABLE invoices ADD COLUMN notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice_line_items (without IF NOT EXISTS to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_line_items' AND policyname = 'Allow public to view invoice line items') THEN
    EXECUTE 'CREATE POLICY "Allow public to view invoice line items" ON invoice_line_items FOR SELECT TO public USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_line_items' AND policyname = 'Allow public to insert invoice line items') THEN
    EXECUTE 'CREATE POLICY "Allow public to insert invoice line items" ON invoice_line_items FOR INSERT TO public WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_line_items' AND policyname = 'Allow public to update invoice line items') THEN
    EXECUTE 'CREATE POLICY "Allow public to update invoice line items" ON invoice_line_items FOR UPDATE TO public USING (true) WITH CHECK (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_line_items' AND policyname = 'Allow public to delete invoice line items') THEN
    EXECUTE 'CREATE POLICY "Allow public to delete invoice line items" ON invoice_line_items FOR DELETE TO public USING (true)';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id ON invoice_line_items(inventory_id);