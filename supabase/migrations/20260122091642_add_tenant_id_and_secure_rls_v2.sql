/*
  # Add Tenant ID and Secure RLS Policies

  1. Schema Changes
    - Add `tenant_id` column to all tables
    - Add indexes on tenant_id for performance
    
  2. Security Changes
    - DROP all existing insecure policies (those with USING (true))
    - CREATE new tenant-based policies for all tables
    - All policies check: tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    
  3. Tables Updated
    - customers
    - products
    - inventory
    - invoices
    - invoice_line_items
    - proposals
    - proposal_line_items
    - campaigns
    - customer_segments
    - stock_movements
    - transactions
    
  4. Security Notes
    - CRITICAL: Only authenticated users within the same tenant can access data
    - INSERT operations enforce tenant_id matches user's tenant
    - No public or cross-tenant access allowed
    - All policies follow principle of least privilege
*/

-- Add tenant_id columns to all tables
DO $$ 
BEGIN
  -- Add tenant_id to customers if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
  END IF;

  -- Add tenant_id to products if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE products ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
  END IF;

  -- Add tenant_id to inventory if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE inventory ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
  END IF;

  -- Add tenant_id to invoices if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
  END IF;

  -- Add tenant_id to invoice_line_items if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoice_line_items' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE invoice_line_items ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_invoice_line_items_tenant_id ON invoice_line_items(tenant_id);
  END IF;

  -- Add tenant_id to proposals if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proposals' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON proposals(tenant_id);
  END IF;

  -- Add tenant_id to proposal_line_items if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proposal_line_items' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE proposal_line_items ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_proposal_line_items_tenant_id ON proposal_line_items(tenant_id);
  END IF;

  -- Add tenant_id to campaigns if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
  END IF;

  -- Add tenant_id to customer_segments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_segments' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE customer_segments ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_customer_segments_tenant_id ON customer_segments(tenant_id);
  END IF;

  -- Add tenant_id to stock_movements if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON stock_movements(tenant_id);
  END IF;

  -- Add tenant_id to transactions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN tenant_id uuid;
    CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
  END IF;
END $$;

-- Drop all insecure policies (those with USING (true) or always-true conditions)
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON inventory;

DROP POLICY IF EXISTS "Authenticated users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON invoices;

DROP POLICY IF EXISTS "Authenticated users can view invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can insert invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can update invoice line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can delete invoice line items" ON invoice_line_items;

DROP POLICY IF EXISTS "Authenticated users can view proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can insert proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can update proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can delete proposals" ON proposals;

DROP POLICY IF EXISTS "Authenticated users can view proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can insert proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can update proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can delete proposal line items" ON proposal_line_items;

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON campaigns;

DROP POLICY IF EXISTS "Authenticated users can view customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Authenticated users can insert customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Authenticated users can update customer segments" ON customer_segments;
DROP POLICY IF EXISTS "Authenticated users can delete customer segments" ON customer_segments;

DROP POLICY IF EXISTS "Authenticated users can view stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Authenticated users can update stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Authenticated users can delete stock movements" ON stock_movements;

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;

-- Create secure tenant-based policies for CUSTOMERS
CREATE POLICY "Users can view own tenant customers"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant customers"
  ON customers FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for PRODUCTS
CREATE POLICY "Users can view own tenant products"
  ON products FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant products"
  ON products FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant products"
  ON products FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for INVENTORY
CREATE POLICY "Users can view own tenant inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for INVOICES
CREATE POLICY "Users can view own tenant invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for INVOICE_LINE_ITEMS
CREATE POLICY "Users can view own tenant invoice line items"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant invoice line items"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant invoice line items"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant invoice line items"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for PROPOSALS
CREATE POLICY "Users can view own tenant proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for PROPOSAL_LINE_ITEMS
CREATE POLICY "Users can view own tenant proposal line items"
  ON proposal_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant proposal line items"
  ON proposal_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant proposal line items"
  ON proposal_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant proposal line items"
  ON proposal_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for CAMPAIGNS
CREATE POLICY "Users can view own tenant campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for CUSTOMER_SEGMENTS
CREATE POLICY "Users can view own tenant customer segments"
  ON customer_segments FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant customer segments"
  ON customer_segments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant customer segments"
  ON customer_segments FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant customer segments"
  ON customer_segments FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for STOCK_MOVEMENTS
CREATE POLICY "Users can view own tenant stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant stock movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant stock movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create secure tenant-based policies for TRANSACTIONS
CREATE POLICY "Users can view own tenant transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
