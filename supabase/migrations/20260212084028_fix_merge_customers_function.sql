/*
  # Fix merge_customers function

  1. Changes
    - Update merge_customers function to use customer_id instead of entity_id
    - Transactions table uses customer_id, not entity_id/entity_type pattern
    
  2. Notes
    - This fixes the "entity_id does not exist" error in customer merge
*/

-- Drop and recreate the merge_customers function with correct column names
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
  source_id uuid;
  source_customer_data jsonb;
  invoice_count int;
  transaction_count int;
  order_count int;
  total_invoices int := 0;
  total_transactions int := 0;
  total_orders int := 0;
  result jsonb;
BEGIN
  -- Loop through each source customer
  FOREACH source_id IN ARRAY source_ids
  LOOP
    -- Get source customer data for audit
    SELECT to_jsonb(c.*) INTO source_customer_data
    FROM customers c
    WHERE c.id = source_id;
    
    -- Update invoices
    UPDATE invoices 
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = source_id;
    GET DIAGNOSTICS invoice_count = ROW_COUNT;
    total_invoices := total_invoices + invoice_count;
    
    -- Update transactions (using customer_id, not entity_id)
    UPDATE transactions 
    SET customer_id = target_id
    WHERE customer_id = source_id;
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
    total_transactions := total_transactions + transaction_count;
    
    -- Update orders
    UPDATE orders 
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = source_id;
    GET DIAGNOSTICS order_count = ROW_COUNT;
    total_orders := total_orders + order_count;
    
    -- Update proposals
    UPDATE proposals 
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = source_id;
    
    -- Update projects (if table exists)
    UPDATE projects 
    SET customer_id = target_id, updated_at = now()
    WHERE customer_id = source_id;
    
    -- Update campaigns
    UPDATE campaigns 
    SET target_customer_id = target_id, updated_at = now()
    WHERE target_customer_id = source_id;
    
    -- Log the merge
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
      source_id,
      source_customer_data,
      merged_by_param,
      notes_param,
      jsonb_build_object(
        'invoices', invoice_count,
        'transactions', transaction_count,
        'orders', order_count
      )
    );
    
    -- Delete the source customer
    DELETE FROM customers WHERE id = source_id;
  END LOOP;
  
  -- Return summary
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