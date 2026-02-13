/*
  # Create Marketplace Integration System

  1. New Tables
    - `marketplaces` - supported marketplace definitions (Trendyol, Hepsiburada, Amazon, N11, etc.)
    - `marketplace_accounts` - seller-marketplace API connections
    - `marketplace_products` - product-marketplace mapping and sync status
    - `marketplace_orders` - orders synced from marketplaces
    - `marketplace_order_items` - order line items
    - `marketplace_sync_logs` - sync operation history

  2. Security
    - RLS enabled on all tables
    - Tenant-based access for all data tables
    - marketplaces reference table readable by all authenticated users

  3. Seed Data
    - 10 Turkish marketplace definitions
*/

-- Marketplaces reference table
CREATE TABLE IF NOT EXISTS marketplaces (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  api_type TEXT NOT NULL DEFAULT 'REST',
  base_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read marketplaces"
  ON marketplaces FOR SELECT TO authenticated
  USING (true);

-- Marketplace Accounts (seller connections)
CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id),
  store_name TEXT DEFAULT '',
  api_key TEXT DEFAULT '',
  api_secret TEXT DEFAULT '',
  seller_code TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, marketplace_id)
);

ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mp_accounts_tenant ON marketplace_accounts(tenant_id);

CREATE POLICY "Users can view own tenant marketplace accounts"
  ON marketplace_accounts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant marketplace accounts"
  ON marketplace_accounts FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update own tenant marketplace accounts"
  ON marketplace_accounts FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant marketplace accounts"
  ON marketplace_accounts FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Marketplace Products (product-marketplace mapping)
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  local_product_id UUID,
  marketplace_product_id TEXT DEFAULT '',
  marketplace_sku TEXT DEFAULT '',
  title TEXT NOT NULL,
  price DECIMAL(15, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  sync_status TEXT DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  error_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mp_products_tenant ON marketplace_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mp_products_account ON marketplace_products(account_id);

CREATE POLICY "Users can view own tenant marketplace products"
  ON marketplace_products FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant marketplace products"
  ON marketplace_products FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can update own tenant marketplace products"
  ON marketplace_products FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant marketplace products"
  ON marketplace_products FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  marketplace_order_id TEXT NOT NULL,
  order_date TIMESTAMPTZ NOT NULL,
  customer_name TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  shipping_address JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  is_synced_to_erp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mp_orders_tenant ON marketplace_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_account ON marketplace_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_mp_orders_date ON marketplace_orders(order_date);

CREATE POLICY "Users can view own tenant marketplace orders"
  ON marketplace_orders FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant marketplace orders"
  ON marketplace_orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can update own tenant marketplace orders"
  ON marketplace_orders FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant marketplace orders"
  ON marketplace_orders FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Marketplace Order Items
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  marketplace_product_id TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  discount DECIMAL(15, 2) DEFAULT 0,
  tax DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mp_order_items_order ON marketplace_order_items(order_id);

CREATE POLICY "Users can view own tenant order items"
  ON marketplace_order_items FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant order items"
  ON marketplace_order_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can update own tenant order items"
  ON marketplace_order_items FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant order items"
  ON marketplace_order_items FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Marketplace Sync Logs
CREATE TABLE IF NOT EXISTS marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'orders',
  status TEXT DEFAULT 'started',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_message TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mp_sync_logs_tenant ON marketplace_sync_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mp_sync_logs_account ON marketplace_sync_logs(account_id);

CREATE POLICY "Users can view own tenant sync logs"
  ON marketplace_sync_logs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant sync logs"
  ON marketplace_sync_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Seed marketplace definitions
INSERT INTO marketplaces (name, code, api_type, base_url) VALUES
  ('Trendyol', 'trendyol', 'REST', 'https://api.trendyol.com/api'),
  ('Hepsiburada', 'hepsiburada', 'REST', 'https://api.hepsiburada.com/api/v1'),
  ('Amazon', 'amazon', 'REST', 'https://sellingpartnerapi-eu.amazon.com'),
  ('N11', 'n11', 'SOAP', 'https://api.n11.com/ws'),
  ('Pazarama', 'pazarama', 'REST', ''),
  ('Ciceksepeti', 'ciceksepeti', 'REST', ''),
  ('Akakce', 'akakce', 'REST', 'https://api.akakce.com'),
  ('Cimri', 'cimri', 'REST', 'https://www.cimri.com/api/market-api'),
  ('Idefix', 'idefix', 'REST', ''),
  ('Teknosa', 'teknosa', 'REST', '')
ON CONFLICT (code) DO NOTHING;
