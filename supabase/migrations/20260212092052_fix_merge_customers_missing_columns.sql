/*
  # Fix merge_customers function - remove references to non-existent columns

  1. Changes
    - Remove UPDATE on campaigns.target_customer_id (column does not exist)
    - Change projects.customer_id to projects.client_id (correct column name)
    - Variable src_id to avoid orders.source_id ambiguity (carried from prior fix)

  2. Notes
    - campaigns table has no customer reference column
    - projects table uses client_id, not customer_id
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
  src_customer_data jsonb;
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
    SELECT to_jsonb(c.*) INTO src_customer_data
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
    WHERE orders.customer_id = src_id;
    GET DIAGNOSTICS order_count = ROW_COUNT;
    total_orders := total_orders + order_count;

    UPDATE proposals
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = src_id;

    UPDATE projects
    SET client_id = target_id, updated_at = now()
    WHERE client_id = src_id;

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
      src_customer_data,
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