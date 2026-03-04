/*
  # receive_purchase_order RPC – Mal kabulü trigger yerine

  Trigger (handle_po_received) bazen 400 veriyor; tüm işlem RPC ile yapılıyor.
  Frontend receive_purchase_order(po_id) çağırır, trigger kaldırıldı.
*/

-- 1. total_cost yoksa ekle (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN total_cost numeric DEFAULT 0;
  END IF;
END $$;

-- 2. Trigger'ı kaldır (RPC kullanacağız)
DROP TRIGGER IF EXISTS trigger_po_received ON public.purchase_orders;

-- 3. Mal kabulü RPC
CREATE OR REPLACE FUNCTION receive_purchase_order(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po record;
  v_item record;
  v_caller_tenant uuid;
BEGIN
  SELECT p.tenant_id INTO v_caller_tenant FROM profiles p WHERE p.id = auth.uid() LIMIT 1;
  IF v_caller_tenant IS NULL THEN
    v_caller_tenant := auth.uid();
  END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id LIMIT 1;
  IF v_po.id IS NULL THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;
  IF v_po.tenant_id IS DISTINCT FROM v_caller_tenant AND v_po.tenant_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Tenant mismatch';
  END IF;
  IF v_po.status = 'received' THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Already received');
  END IF;
  IF v_po.status NOT IN ('approved', 'ordered') THEN
    RAISE EXCEPTION 'PO must be approved or ordered to receive';
  END IF;

  FOR v_item IN
    SELECT poi.*, p.name as product_name
    FROM purchase_order_items poi
    JOIN products p ON p.id = poi.product_id
    WHERE poi.purchase_order_id = p_po_id
  LOOP
    INSERT INTO stock_movements (
      tenant_id, product_id, movement_type, quantity, unit_cost, total_cost,
      reason, reference_type, reference_id, notes, created_by
    ) VALUES (
      v_po.tenant_id, v_item.product_id, 'in', v_item.quantity, v_item.unit_price, v_item.line_total,
      'PO: ' || v_po.po_number || ' - ' || v_item.product_name,
      'purchase_order', p_po_id, 'PO: ' || v_po.po_number || ' - ' || v_item.product_name, v_po.received_by
    );

    UPDATE products
    SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity, updated_at = now()
    WHERE id = v_item.product_id AND tenant_id = v_po.tenant_id;

    INSERT INTO supplier_price_history (
      tenant_id, supplier_id, product_id, unit_price, currency, order_date, purchase_order_id
    ) VALUES (
      v_po.tenant_id, v_po.supplier_id, v_item.product_id, v_item.unit_price,
      COALESCE(v_po.currency, 'TRY'), (v_po.order_date)::date, p_po_id
    );
  END LOOP;

  INSERT INTO expenses (
    tenant_id, category, amount, currency, description, expense_date, status,
    branch_id, project_id, created_by
  ) VALUES (
    v_po.tenant_id, 'other', v_po.total_amount, COALESCE(v_po.currency, 'TRY'),
    'Purchase Order: ' || v_po.po_number, (v_po.order_date)::date, 'unpaid',
    v_po.branch_id, v_po.project_id, v_po.received_by
  );

  UPDATE suppliers
  SET total_orders_count = total_orders_count + 1,
      total_spent = total_spent + v_po.total_amount,
      average_delivery_days = (
        SELECT AVG((actual_delivery_date - order_date))::integer
        FROM purchase_orders
        WHERE supplier_id = v_po.supplier_id AND status = 'received' AND actual_delivery_date IS NOT NULL
      ),
      updated_at = now()
  WHERE id = v_po.supplier_id;

  UPDATE purchase_orders
  SET status = 'received', actual_delivery_date = CURRENT_DATE, updated_at = now()
  WHERE id = p_po_id;

  RETURN jsonb_build_object('ok', true, 'po_number', v_po.po_number);
END;
$$;

GRANT EXECUTE ON FUNCTION receive_purchase_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION receive_purchase_order(uuid) TO service_role;
