/*
  # Fix handle_po_received trigger and expenses for PO receipt

  1. expenses.category: allow 'purchase' (trigger inserts category = 'purchase')
  2. expenses.status: trigger uses 'pending' but allowed values are ('unpaid','partially_paid','paid') -> use 'unpaid'
  3. stock_movements.reason: table has reason NOT NULL, trigger did not set it -> set reason in trigger
*/

-- 1. Allow 'purchase' in expenses.category
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'public.expenses'::regclass AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%general%' AND pg_get_constraintdef(c.oid) LIKE '%marketing%'
  LOOP
    EXECUTE format('ALTER TABLE public.expenses DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
    CHECK (category IN ('general', 'marketing', 'personnel', 'office', 'tax', 'utilities', 'rent', 'other', 'purchase'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Recreate handle_po_received: use status 'unpaid', add reason to stock_movements
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
        NEW.currency, NEW.order_date, NEW.id
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
      'purchase',
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
