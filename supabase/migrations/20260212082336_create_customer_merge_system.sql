/*
  # Customer Merge System

  1. New Tables
    - `customer_merge_logs`
      - Tracks all customer merge operations
      - Records which customers were merged and into which customer
      - Keeps merge history for auditing
    
  2. Features
    - Merge multiple customers into one
    - Transfer all related data (invoices, transactions, etc.)
    - Keep audit trail of merged customers
    - Function to execute merge with data migration
    
  3. Security
    - RLS enabled on merge logs
    - Only authenticated users can view merge logs
    - Super admins can perform merges
*/

-- Create customer merge logs table
CREATE TABLE IF NOT EXISTS customer_merge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  target_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source_customer_id uuid NOT NULL,
  source_customer_data jsonb NOT NULL,
  merged_by uuid REFERENCES auth.users(id),
  merged_at timestamptz DEFAULT now(),
  notes text,
  related_records_count jsonb DEFAULT '{"invoices": 0, "transactions": 0, "orders": 0}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_merge_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view merge logs for their tenant"
  ON customer_merge_logs FOR SELECT
  TO authenticated
  USING (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

CREATE POLICY "Admins can insert merge logs"
  ON customer_merge_logs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_merge_logs_tenant_id ON customer_merge_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_merge_logs_target_customer_id ON customer_merge_logs(target_customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_merge_logs_source_customer_id ON customer_merge_logs(source_customer_id);

-- Function to merge customers
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
    
    -- Update transactions
    UPDATE transactions 
    SET entity_id = target_id, updated_at = now()
    WHERE entity_id = source_id AND entity_type = 'customer';
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
    
    -- Update projects
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