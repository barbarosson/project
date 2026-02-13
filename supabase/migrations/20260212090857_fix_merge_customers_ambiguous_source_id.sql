/*
  # Fix merge_customers function - ambiguous source_id

  1. Changes
    - Rename local variable `source_id` to `src_id` to avoid conflict
      with `orders.source_id` column
    - This fixes "column reference source_id is ambiguous" error

  2. Notes
    - The `orders` table has a column named `source_id`
    - PL/pgSQL variable `source_id` clashes with this column in UPDATE
*/

CREATE OR REPLACE FUNCTION merge_customers(
  target_id uuid,
  source_ids uuid[],
  tenant_id_param uuid,
  merged_by_param uuid,
  notes_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src_id uuid;
  source_customer_data jsonb;
  invoice_count int;
  transaction_count int;
  order_count int;
  total_invoices int := 0;
  total_transactions int := 0;
  total_orders int := 0;
  result jsonb;
BEGIN
  FOREACH src_id IN ARRAY source_ids
  LOOP
    SELECT to_jsonb(c.*) INTO source_customer_data
    FROM customers c
    WHERE c.id = src_id;

    UPDATE invoices
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = src_id;
    GET DIAGNOSTICS invoice_count = ROW_COUNT;
    total_invoices := total_invoices + invoice_count;

    UPDATE transactions
    SET customer_id = target_id
    WHERE customer_id = src_id;
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
    total_transactions := total_transactions + transaction_count;

    UPDATE orders
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = src_id;
    GET DIAGNOSTICS order_count = ROW_COUNT;
    total_orders := total_orders + order_count;

    UPDATE proposals
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = src_id;

    UPDATE projects
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = src_id;

    UPDATE campaigns
    SET target_customer_id = target_id, updated_at = now()
    WHERE target_customer_id = src_id;

    INSERT INTO customer_merge_logs (
      tenant_id,
      target_customer_id,
      source_customer_id,
      source_customer_data,
      merged_by,
      notes,
      related_records_count
    ) VALUES (
      tenant_id_param,
      target_id,
      src_id,
      source_customer_data,
      merged_by_param,
      notes_param,
      jsonb_build_object(
        'invoices', invoice_count,
        'transactions', transaction_count,
        'orders', order_count
      )
    );

    DELETE FROM customers WHERE id = src_id;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'merged_count', array_length(source_ids, 1),
    'total_invoices_transferred', total_invoices,
    'total_transactions_transferred', total_transactions,
    'total_orders_transferred', total_orders
  );

  RETURN result;
END;
$$;