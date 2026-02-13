/*
  # Comprehensive Security and Performance Fix

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Creates indexes on foreign key columns for optimal query performance

  ### 2. Remove Unused Indexes
  Drops indexes that have not been used to reduce storage overhead

  ### 3. Remove Duplicate RLS Policies
  Removes duplicate permissive policies to avoid conflicts

  ### 4. Fix Function Search Paths
  Updates functions to have immutable search paths for security

  ### 5. Enable RLS on Public Tables
  Enables Row Level Security on reference tables with public read access
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_inventory_id 
  ON invoice_line_items(inventory_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_product_id 
  ON invoice_line_items(product_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
  ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_proposal_line_items_product_id 
  ON proposal_line_items(product_id);

CREATE INDEX IF NOT EXISTS idx_proposals_customer_id 
  ON proposals(customer_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_product_id 
  ON purchase_invoice_line_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_purchase_invoice_id 
  ON purchase_invoice_line_items(purchase_invoice_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id 
  ON purchase_invoices(supplier_id);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id 
  ON transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id 
  ON transactions(customer_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_customers_city;
DROP INDEX IF EXISTS idx_customers_payment_terms;
DROP INDEX IF EXISTS idx_invoices_payment_date;
DROP INDEX IF EXISTS idx_invoices_status_due_date;
DROP INDEX IF EXISTS idx_invoices_tenant_status;
DROP INDEX IF EXISTS idx_expenses_account_id;
DROP INDEX IF EXISTS idx_stock_movements_unit_cost;
DROP INDEX IF EXISTS idx_products_average_cost;

-- =====================================================
-- 3. REMOVE DUPLICATE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can select own tenant accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own tenant chat history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can insert own tenant chat history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can select own tenant campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can select own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users can select own tenant expenses" ON expenses;
DROP POLICY IF EXISTS "Users can select own tenant inventory" ON inventory;
DROP POLICY IF EXISTS "Users can select own tenant invoices" ON invoices;
DROP POLICY IF EXISTS "Users can select own tenant products" ON products;
DROP POLICY IF EXISTS "Users can select own tenant transactions" ON transactions;

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Update generate_campaign_code with secure search_path
CREATE OR REPLACE FUNCTION generate_campaign_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'CAM-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
    
    SELECT EXISTS(SELECT 1 FROM campaigns WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update set_campaign_code with secure search_path
CREATE OR REPLACE FUNCTION set_campaign_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_campaign_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_invoice_payment_amounts with secure search_path
CREATE OR REPLACE FUNCTION update_invoice_payment_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    NEW.paid_amount := NEW.total;
    NEW.remaining_amount := 0;
  ELSIF NEW.status IN ('draft', 'sent') THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - COALESCE(NEW.paid_amount, 0);
  ELSIF NEW.status = 'overdue' THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - NEW.paid_amount;
  ELSIF NEW.status = 'partially_paid' THEN
    NEW.paid_amount := COALESCE(NEW.paid_amount, 0);
    NEW.remaining_amount := NEW.total - NEW.paid_amount;
  ELSIF NEW.status = 'cancelled' THEN
    NEW.paid_amount := 0;
    NEW.remaining_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update calculate_product_average_cost with secure search_path
CREATE OR REPLACE FUNCTION calculate_product_average_cost(p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_cost numeric;
  v_total_quantity numeric;
  v_average numeric;
BEGIN
  SELECT 
    COALESCE(SUM(quantity * unit_cost), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total_cost, v_total_quantity
  FROM stock_movements
  WHERE product_id = p_product_id
    AND movement_type = 'in'
    AND unit_cost > 0;
  
  IF v_total_quantity > 0 THEN
    v_average := v_total_cost / v_total_quantity;
  ELSE
    v_average := 0;
  END IF;
  
  RETURN v_average;
END;
$$;

-- =====================================================
-- 5. ENABLE RLS ON PUBLIC REFERENCE TABLES
-- =====================================================

ALTER TABLE turkish_banks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to turkish banks" ON turkish_banks;
CREATE POLICY "Public read access to turkish banks"
  ON turkish_banks
  FOR SELECT
  TO public
  USING (true);

ALTER TABLE turkish_provinces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to turkish provinces" ON turkish_provinces;
CREATE POLICY "Public read access to turkish provinces"
  ON turkish_provinces
  FOR SELECT
  TO public
  USING (true);
