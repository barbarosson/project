/*
  # Orders Module & Cross-Module Integration

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `tenant_id` (text, required)
      - `order_number` (text, unique per tenant)
      - `source` (text: manual, marketplace, import)
      - `source_id` (text, external reference)
      - `customer_id` (uuid, references customers)
      - `status` (text: pending, confirmed, processing, shipped, delivered, completed, cancelled)
      - `subtotal`, `tax_total`, `total` (numeric)
      - `currency` (text, default TRY)
      - `shipping_address`, `billing_address` (jsonb)
      - `notes` (text)
      - `invoice_id` (uuid, linked invoice)
      - `edocument_id` (uuid, linked e-document)
      - `marketplace_account_id` (uuid, marketplace source)
      - Timestamp columns for status transitions
    - `order_items`
      - `id` (uuid, primary key)
      - `tenant_id` (text, required)
      - `order_id` (uuid, references orders with cascade delete)
      - `product_id` (uuid, references products)
      - `product_name`, `sku` (text)
      - `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `discount`, `total` (numeric)

  2. Modified Tables
    - `invoices` - added `order_id` column for order linking
    - `edocuments` - added `order_id` column for order linking
    - `marketplace_orders` - added `local_order_id` column for central order linking

  3. Security
    - RLS enabled on `orders` and `order_items`
    - Tenant-based isolation policies for SELECT, INSERT, UPDATE, DELETE

  4. Performance
    - Indexes on tenant_id, customer_id, status, source, order_number
    - Indexes on order_items for order_id and product_id
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  order_number text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  source_id text,
  customer_id uuid,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) DEFAULT 0,
  tax_total numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'TRY',
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  invoice_id uuid,
  edocument_id uuid,
  marketplace_account_id uuid,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders tenant select"
  ON orders FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Orders tenant insert"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Orders tenant update"
  ON orders FOR UPDATE TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Orders tenant delete"
  ON orders FOR DELETE TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(tenant_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(tenant_id, created_at DESC);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  sku text,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 18,
  tax_amount numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items tenant select"
  ON order_items FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Order items tenant insert"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Order items tenant update"
  ON order_items FOR UPDATE TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Order items tenant delete"
  ON order_items FOR DELETE TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add cross-module linking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN order_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edocuments' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE edocuments ADD COLUMN order_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_orders' AND column_name = 'local_order_id'
  ) THEN
    ALTER TABLE marketplace_orders ADD COLUMN local_order_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_edocuments_order_id ON edocuments(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_local_order_id ON marketplace_orders(local_order_id);
