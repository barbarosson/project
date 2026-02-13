/*
  # Procurement Module - Complete Schema

  1. New Tables
    - suppliers: Vendor/supplier master data with ratings
    - purchase_orders: Main purchase order tracking
    - purchase_order_items: Line items for each PO
    - purchase_requisitions: Auto-generated purchase suggestions

  2. Features
    - Automatic inventory updates via trigger
    - Automatic expense invoice generation
    - Supplier performance tracking
    - Branch and project linking
    - Multi-currency support

  3. Security
    - Enable RLS on all tables
    - Tenant isolation for all tables
    - Super admin access policies
*/

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  tax_id text,
  category text DEFAULT 'general',
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'TR',
  reliability_rating integer DEFAULT 3 CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  status text DEFAULT 'active' CHECK (status IN ('active', 'blacklisted', 'suspended', 'inactive')),
  payment_terms text,
  notes text,
  total_orders_count integer DEFAULT 0,
  total_spent numeric(15,2) DEFAULT 0,
  average_delivery_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(reliability_rating);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant suppliers" ON suppliers
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant suppliers" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant suppliers" ON suppliers
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant suppliers" ON suppliers
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- PURCHASE ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES branches(id),
  project_id uuid REFERENCES projects(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  actual_delivery_date date,
  subtotal numeric(15,2) DEFAULT 0,
  shipping_cost numeric(15,2) DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  discount_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) DEFAULT 0,
  currency text DEFAULT 'TRY',
  payment_terms text,
  notes text,
  received_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(tenant_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_po_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_po_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(tenant_id, po_number);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant purchase orders" ON purchase_orders
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant purchase orders" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant purchase orders" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant purchase orders" ON purchase_orders
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity numeric(15,3) NOT NULL,
  received_quantity numeric(15,3) DEFAULT 0,
  unit_price numeric(15,2) NOT NULL,
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(15,2) DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  line_total numeric(15,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_items_tenant ON purchase_order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant PO items" ON purchase_order_items
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant PO items" ON purchase_order_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant PO items" ON purchase_order_items
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant PO items" ON purchase_order_items
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- PURCHASE REQUISITIONS TABLE (AI-Generated Suggestions)
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock numeric(15,3),
  min_stock_level numeric(15,3),
  suggested_quantity numeric(15,3),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'rejected')),
  reason text,
  converted_to_po_id uuid REFERENCES purchase_orders(id),
  created_at timestamptz DEFAULT now(),
  created_by_system boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_requisitions_tenant ON purchase_requisitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_priority ON purchase_requisitions(priority);
CREATE INDEX IF NOT EXISTS idx_requisitions_product ON purchase_requisitions(product_id);

ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant requisitions" ON purchase_requisitions
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant requisitions" ON purchase_requisitions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant requisitions" ON purchase_requisitions
  FOR UPDATE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant requisitions" ON purchase_requisitions
  FOR DELETE TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- SUPPLIER PRICE HISTORY (For AI Price Watchdog)
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_price numeric(15,2) NOT NULL,
  currency text DEFAULT 'TRY',
  order_date date NOT NULL,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_tenant ON supplier_price_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier ON supplier_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON supplier_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON supplier_price_history(order_date DESC);

ALTER TABLE supplier_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant price history" ON supplier_price_history
  FOR SELECT TO authenticated
  USING (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "System can insert price history" ON supplier_price_history
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((select auth.jwt()) -> 'app_metadata' ->> 'tenant_id'));

-- ============================================================
-- FUNCTION: Generate unique PO number
-- ============================================================

CREATE OR REPLACE FUNCTION generate_po_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_po_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
  AND po_number LIKE 'PO-' || v_year || '%';
  
  v_po_number := 'PO-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  
  RETURN v_po_number;
END;
$$;

-- ============================================================
-- TRIGGER: Update inventory when PO is received
-- ============================================================

CREATE OR REPLACE FUNCTION handle_po_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_invoice_id uuid;
BEGIN
  -- Only process when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    
    -- Update actual delivery date
    NEW.actual_delivery_date := CURRENT_DATE;
    
    -- 1. Create stock movements for all items
    FOR v_item IN 
      SELECT poi.*, p.name as product_name
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      -- Insert stock movement (IN)
      INSERT INTO stock_movements (
        tenant_id,
        product_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        notes,
        created_by
      ) VALUES (
        NEW.tenant_id,
        v_item.product_id,
        'IN',
        v_item.quantity,
        v_item.unit_price,
        v_item.line_total,
        'purchase_order',
        NEW.id,
        'PO: ' || NEW.po_number || ' - ' || v_item.product_name,
        NEW.received_by
      );
      
      -- Update product stock quantity
      UPDATE products
      SET 
        stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
        updated_at = now()
      WHERE id = v_item.product_id
      AND tenant_id = NEW.tenant_id;
      
      -- Log price history
      INSERT INTO supplier_price_history (
        tenant_id,
        supplier_id,
        product_id,
        unit_price,
        currency,
        order_date,
        purchase_order_id
      ) VALUES (
        NEW.tenant_id,
        NEW.supplier_id,
        v_item.product_id,
        v_item.unit_price,
        NEW.currency,
        NEW.order_date,
        NEW.id
      );
    END LOOP;
    
    -- 2. Create draft expense invoice
    INSERT INTO expenses (
      tenant_id,
      category,
      amount,
      currency,
      description,
      expense_date,
      status,
      reference_type,
      reference_id,
      branch_id,
      project_id,
      created_by
    ) VALUES (
      NEW.tenant_id,
      'purchase',
      NEW.total_amount,
      NEW.currency,
      'Purchase Order: ' || NEW.po_number,
      NEW.order_date,
      'pending',
      'purchase_order',
      NEW.id,
      NEW.branch_id,
      NEW.project_id,
      NEW.received_by
    );
    
    -- 3. Update supplier statistics
    UPDATE suppliers
    SET 
      total_orders_count = total_orders_count + 1,
      total_spent = total_spent + NEW.total_amount,
      average_delivery_days = (
        SELECT AVG(EXTRACT(DAY FROM (actual_delivery_date - order_date)))::integer
        FROM purchase_orders
        WHERE supplier_id = NEW.supplier_id
        AND status = 'received'
        AND actual_delivery_date IS NOT NULL
      ),
      updated_at = now()
    WHERE id = NEW.supplier_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_po_received
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_po_received();

-- ============================================================
-- TRIGGER: Update PO totals when items change
-- ============================================================

CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po_id uuid;
  v_subtotal numeric;
BEGIN
  -- Get the PO ID
  IF TG_OP = 'DELETE' THEN
    v_po_id := OLD.purchase_order_id;
  ELSE
    v_po_id := NEW.purchase_order_id;
  END IF;
  
  -- Calculate subtotal
  SELECT COALESCE(SUM(line_total), 0)
  INTO v_subtotal
  FROM purchase_order_items
  WHERE purchase_order_id = v_po_id;
  
  -- Update PO
  UPDATE purchase_orders
  SET 
    subtotal = v_subtotal,
    total_amount = v_subtotal + COALESCE(shipping_cost, 0) + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0),
    updated_at = now()
  WHERE id = v_po_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_po_totals_insert
  AFTER INSERT ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_update
  AFTER UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_delete
  AFTER DELETE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();
