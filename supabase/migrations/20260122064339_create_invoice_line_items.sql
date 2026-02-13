/*
  # Create Invoice Line Items Table

  ## Overview
  This migration creates the invoice_line_items table to support detailed invoicing
  with multiple products/services per invoice, including VAT calculations.

  ## New Table

  ### `invoice_line_items`
  Stores individual line items for each invoice
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Reference to invoices table
  - `product_name` (text) - Product or service name
  - `description` (text) - Optional description
  - `quantity` (numeric) - Quantity of items
  - `unit_price` (numeric) - Price per unit
  - `vat_rate` (numeric) - VAT percentage (1, 10, 20, etc.)
  - `line_total` (numeric) - Quantity × Unit Price
  - `vat_amount` (numeric) - Line Total × VAT Rate
  - `total_with_vat` (numeric) - Line Total + VAT Amount
  - `inventory_id` (uuid) - Optional reference to inventory table
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Changes to `invoices` table
  - Add `subtotal` (numeric) - Sum of all line totals
  - Add `total_vat` (numeric) - Sum of all VAT amounts
  - Add `issue_date` (date) - Invoice issue date

  ## Security
  - Enable RLS on invoice_line_items table
  - Add policies for public access (development mode)

  ## Notes
  - Foreign key ensures referential integrity
  - Amounts are calculated and stored for performance
  - VAT rates are stored per line item for flexibility
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

-- Create policies for invoice_line_items
CREATE POLICY "Allow public to view invoice line items"
  ON invoice_line_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert invoice line items"
  ON invoice_line_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update invoice line items"
  ON invoice_line_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete invoice line items"
  ON invoice_line_items FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id ON invoice_line_items(inventory_id);

-- Insert sample invoices with line items
INSERT INTO invoices (customer_id, invoice_number, amount, subtotal, total_vat, status, issue_date, due_date) 
SELECT 
  id,
  'INV-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  0,
  0,
  0,
  'pending',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days'
FROM customers
LIMIT 1
ON CONFLICT DO NOTHING;

-- Get the invoice ID we just created
DO $$
DECLARE
  v_invoice_id uuid;
  v_inventory_id uuid;
BEGIN
  SELECT id INTO v_invoice_id FROM invoices WHERE invoice_number LIKE 'INV-%' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_inventory_id FROM inventory LIMIT 1;
  
  IF v_invoice_id IS NOT NULL THEN
    -- Add sample line items
    INSERT INTO invoice_line_items (invoice_id, product_name, description, quantity, unit_price, vat_rate, line_total, vat_amount, total_with_vat, inventory_id)
    VALUES
      (v_invoice_id, 'Laptop Pro 15"', 'High-performance laptop', 2, 1299.99, 20, 2599.98, 519.996, 3119.976, v_inventory_id),
      (v_invoice_id, 'Professional Services', 'Consulting and setup', 10, 150.00, 20, 1500.00, 300.00, 1800.00, NULL);
    
    -- Update invoice totals
    UPDATE invoices 
    SET 
      subtotal = 4099.98,
      total_vat = 819.996,
      amount = 4919.976
    WHERE id = v_invoice_id;
  END IF;
END $$;