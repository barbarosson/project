/*
  # Add Public Access for Dev Tenant (Safe Mode)

  This migration adds public access policies for the dev tenant to enable
  unauthenticated access for demo/development purposes.

  ## Problem

  When users are not authenticated, they cannot access any data because all
  RLS policies require the `authenticated` role. This causes the app to hang
  indefinitely waiting for data.

  ## Solution

  Add permissive policies for the `public` role (unauthenticated users) that
  allow access ONLY to the dev tenant (00000000-0000-0000-0000-000000000001).

  ## Security

  - Access is restricted to dev tenant only
  - Production tenants remain fully secured
  - This enables "Safe Mode" demo access without authentication

  ## Tables Updated

  All core tables:
  - customers, products, inventory, invoices, invoice_line_items
  - proposals, proposal_line_items, campaigns, customer_segments
  - stock_movements, transactions, purchase_invoices
  - purchase_invoice_line_items, expenses, company_settings, support_tickets
*/

-- CUSTOMERS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant customers"
  ON customers FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- PRODUCTS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant products"
  ON products FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- INVENTORY Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant inventory"
  ON inventory FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- INVOICES Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant invoices"
  ON invoices FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- INVOICE_LINE_ITEMS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant invoice line items"
  ON invoice_line_items FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- PROPOSALS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant proposals"
  ON proposals FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- PROPOSAL_LINE_ITEMS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant proposal line items"
  ON proposal_line_items FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- CAMPAIGNS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant campaigns"
  ON campaigns FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- CUSTOMER_SEGMENTS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant customer segments"
  ON customer_segments FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- STOCK_MOVEMENTS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant stock movements"
  ON stock_movements FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- TRANSACTIONS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant transactions"
  ON transactions FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- PURCHASE_INVOICES Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant purchase invoices"
  ON purchase_invoices FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- PURCHASE_INVOICE_LINE_ITEMS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant purchase invoice line items"
  ON purchase_invoice_line_items FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- EXPENSES Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant expenses"
  ON expenses FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- COMPANY_SETTINGS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant company settings"
  ON company_settings FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- SUPPORT_TICKETS Public Dev Tenant Policy
CREATE POLICY "Public access to dev tenant support tickets"
  ON support_tickets FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);