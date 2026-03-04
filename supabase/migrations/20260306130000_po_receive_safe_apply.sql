/*
  # Mal kabulü (PO receive) – tek seferde güvenli uygulama

  PATCH purchase_orders 400 hatasını gidermek için:
  1. stock_movements.total_cost yoksa ekle
  2. handle_po_received trigger: expenses için category 'other', status 'unpaid', stock_movements.reason set
*/

-- 1. total_cost sütunu (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN total_cost numeric DEFAULT 0;
  END IF;
END $$;

-- 2. Trigger: category 'other' (expenses CHECK'e uyar), reason ve total_cost set
CREATE OR REPLACE FUNCTION handle_po_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    NEW.actual_delivery_date := CURRENT_DATE;

    FOR v_item IN
      SELECT poi.*, p.name as product_name
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      WHERE poi.purchase_order_id = NEW.id
    LOOP
      INSERT INTO stock_movements (
        tenant_id,
        product_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        reason,
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
        'PO: ' || NEW.po_number || ' - ' || v_item.product_name,
        'purchase_order',
        NEW.id,
        'PO: ' || NEW.po_number || ' - ' || v_item.product_name,
        NEW.received_by
      );

      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
          updated_at = now()
      WHERE id = v_item.product_id AND tenant_id = NEW.tenant_id;

      INSERT INTO supplier_price_history (
        tenant_id, supplier_id, product_id, unit_price, currency, order_date, purchase_order_id
      ) VALUES (
        NEW.tenant_id, NEW.supplier_id, v_item.product_id, v_item.unit_price,
        COALESCE(NEW.currency, 'TRY'), (NEW.order_date)::date, NEW.id
      );
    END LOOP;

    INSERT INTO expenses (
      tenant_id,
      category,
      amount,
      currency,
      description,
      expense_date,
      status,
      branch_id,
      project_id,
      created_by
    ) VALUES (
      NEW.tenant_id,
      'other',
      NEW.total_amount,
      COALESCE(NEW.currency, 'TRY'),
      'Purchase Order: ' || NEW.po_number,
      (NEW.order_date)::date,
      'unpaid',
      NEW.branch_id,
      NEW.project_id,
      NEW.received_by
    );

    UPDATE suppliers
    SET total_orders_count = total_orders_count + 1,
        total_spent = total_spent + NEW.total_amount,
        average_delivery_days = (
          SELECT AVG(EXTRACT(DAY FROM (actual_delivery_date - order_date)))::integer
          FROM purchase_orders
          WHERE supplier_id = NEW.supplier_id AND status = 'received' AND actual_delivery_date IS NOT NULL
        ),
        updated_at = now()
    WHERE id = NEW.supplier_id;
  END IF;
  RETURN NEW;
END;
$$;
