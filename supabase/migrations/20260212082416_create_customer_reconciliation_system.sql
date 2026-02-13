/*
  # Customer Reconciliation System (Mutabakat Modülü)

  1. New Tables
    - `reconciliation_requests`
      - Stores reconciliation requests sent to customers
      - Tracks date ranges and balances
    - `reconciliation_responses`
      - Stores customer responses (agreed/disagreed)
      - Email-based automatic processing
    
  2. Features
    - Generate reconciliation statements for customers
    - Send reconciliation emails to customers
    - Track email delivery and responses
    - Automatic processing of email responses
    - Reconciliation reports and statistics
    
  3. Security
    - RLS enabled on all tables
    - Tenant isolation enforced
*/

-- Create reconciliation requests table
CREATE TABLE IF NOT EXISTS reconciliation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  request_number text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  opening_balance numeric(15,2) DEFAULT 0,
  total_debits numeric(15,2) DEFAULT 0,
  total_credits numeric(15,2) DEFAULT 0,
  closing_balance numeric(15,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'agreed', 'disagreed', 'expired')),
  sent_at timestamptz,
  sent_to_email text,
  response_received_at timestamptz,
  response_method text CHECK (response_method IN ('email', 'manual', 'system')),
  notes text,
  customer_notes text,
  details jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reconciliation responses table
CREATE TABLE IF NOT EXISTS reconciliation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_request_id uuid NOT NULL REFERENCES reconciliation_requests(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('agreed', 'disagreed', 'partial')),
  customer_balance numeric(15,2),
  difference_amount numeric(15,2),
  reason text,
  response_email text,
  response_date timestamptz DEFAULT now(),
  processed_by uuid REFERENCES auth.users(id),
  auto_processed boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reconciliation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reconciliation_requests
CREATE POLICY "Users can view reconciliation requests for their tenant"
  ON reconciliation_requests FOR SELECT
  TO authenticated
  USING (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

CREATE POLICY "Users can insert reconciliation requests for their tenant"
  ON reconciliation_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

CREATE POLICY "Users can update reconciliation requests for their tenant"
  ON reconciliation_requests FOR UPDATE
  TO authenticated
  USING (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

-- RLS Policies for reconciliation_responses
CREATE POLICY "Users can view reconciliation responses for their tenant"
  ON reconciliation_responses FOR SELECT
  TO authenticated
  USING (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

CREATE POLICY "Users can insert reconciliation responses for their tenant"
  ON reconciliation_responses FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::text = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_requests_tenant_id ON reconciliation_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_requests_customer_id ON reconciliation_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_requests_status ON reconciliation_requests(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_requests_start_date ON reconciliation_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_responses_request_id ON reconciliation_responses(reconciliation_request_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_responses_tenant_id ON reconciliation_responses(tenant_id);

-- Function to generate reconciliation statement
CREATE OR REPLACE FUNCTION generate_reconciliation_statement(
  customer_id_param uuid,
  start_date_param date,
  end_date_param date,
  tenant_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opening_balance_val numeric(15,2);
  total_debits_val numeric(15,2);
  total_credits_val numeric(15,2);
  closing_balance_val numeric(15,2);
  result jsonb;
BEGIN
  -- Calculate opening balance (before start date)
  SELECT COALESCE(SUM(
    CASE 
      WHEN i.type = 'income' THEN i.total
      WHEN i.type = 'expense' THEN -i.total
      ELSE 0
    END
  ), 0) INTO opening_balance_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date < start_date_param;
  
  -- Calculate total debits (invoices to customer)
  SELECT COALESCE(SUM(i.total), 0) INTO total_debits_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date >= start_date_param
    AND i.issue_date <= end_date_param
    AND i.type = 'income';
  
  -- Calculate total credits (payments from customer)
  SELECT COALESCE(SUM(i.paid_amount), 0) INTO total_credits_val
  FROM invoices i
  WHERE i.customer_id = customer_id_param
    AND i.tenant_id = tenant_id_param
    AND i.issue_date >= start_date_param
    AND i.issue_date <= end_date_param
    AND i.type = 'income';
  
  -- Calculate closing balance
  closing_balance_val := opening_balance_val + total_debits_val - total_credits_val;
  
  -- Build result
  result := jsonb_build_object(
    'opening_balance', opening_balance_val,
    'total_debits', total_debits_val,
    'total_credits', total_credits_val,
    'closing_balance', closing_balance_val,
    'period_start', start_date_param,
    'period_end', end_date_param
  );
  
  RETURN result;
END;
$$;

-- Function to process email response
CREATE OR REPLACE FUNCTION process_reconciliation_response(
  request_id_param uuid,
  response_type_param text,
  customer_balance_param numeric DEFAULT NULL,
  reason_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record reconciliation_requests%ROWTYPE;
  difference numeric(15,2);
  result jsonb;
BEGIN
  -- Get request record
  SELECT * INTO request_record
  FROM reconciliation_requests
  WHERE id = request_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  -- Calculate difference if customer balance provided
  IF customer_balance_param IS NOT NULL THEN
    difference := request_record.closing_balance - customer_balance_param;
  ELSE
    difference := 0;
  END IF;
  
  -- Insert response
  INSERT INTO reconciliation_responses (
    reconciliation_request_id,
    tenant_id,
    response_type,
    customer_balance,
    difference_amount,
    reason,
    auto_processed
  ) VALUES (
    request_id_param,
    request_record.tenant_id,
    response_type_param,
    customer_balance_param,
    difference,
    reason_param,
    true
  );
  
  -- Update request status
  UPDATE reconciliation_requests
  SET 
    status = response_type_param,
    response_received_at = now(),
    response_method = 'email',
    updated_at = now()
  WHERE id = request_id_param;
  
  result := jsonb_build_object(
    'success', true,
    'request_id', request_id_param,
    'response_type', response_type_param,
    'difference', difference
  );
  
  RETURN result;
END;
$$;