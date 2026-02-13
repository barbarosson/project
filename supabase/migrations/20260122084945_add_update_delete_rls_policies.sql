/*
  # Add UPDATE and DELETE RLS Policies

  1. Policy Updates
    - Add UPDATE policies for all tables to allow authenticated users to modify records
    - Add DELETE policies for all tables to allow authenticated users to delete records
    
  2. Tables Affected
    - customers: Allow authenticated users to update and delete customer records
    - products: Allow authenticated users to update and delete product records
    - invoices: Allow authenticated users to update and delete invoices
    - proposals: Allow authenticated users to update and delete proposals
    - campaigns: Allow authenticated users to update and delete campaigns
    - invoice_line_items: Allow authenticated users to update and delete line items
    - proposal_line_items: Allow authenticated users to update and delete line items
    - stock_movements: Allow authenticated users to update and delete stock movements
    - transactions: Allow authenticated users to update and delete transactions
    - inventory: Allow authenticated users to update and delete inventory items
    - customer_segments: Allow authenticated users to update and delete segments

  3. Security Notes
    - All policies require authentication
    - These policies enable full CRUD operations for the application
*/

-- Customers
CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Products
CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Invoices
CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Proposals
CREATE POLICY "Authenticated users can update proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (true);

-- Campaigns
CREATE POLICY "Authenticated users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (true);

-- Invoice Line Items
CREATE POLICY "Authenticated users can update invoice line items"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoice line items"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (true);

-- Proposal Line Items
CREATE POLICY "Authenticated users can update proposal line items"
  ON proposal_line_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete proposal line items"
  ON proposal_line_items FOR DELETE
  TO authenticated
  USING (true);

-- Stock Movements
CREATE POLICY "Authenticated users can update stock movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stock movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (true);

-- Transactions
CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- Inventory
CREATE POLICY "Authenticated users can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- Customer Segments
CREATE POLICY "Authenticated users can update customer segments"
  ON customer_segments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customer segments"
  ON customer_segments FOR DELETE
  TO authenticated
  USING (true);
