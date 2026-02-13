/*
  # Fix Transactions Polymorphic Reference - PGRST200 Error Resolution

  ## Problem
  PGRST200 Error: "Searched for a foreign key relationship between transactions and reference_id"
  
  The transactions table uses a polymorphic reference pattern where reference_id can point
  to different tables (invoices, expenses, etc.) based on the reference_type field.
  PostgREST cannot handle this natively and requires explicit foreign key relationships
  for join syntax.

  ## Solution
  1. Document the polymorphic relationship pattern with database comments
  2. Create helper views for common queries (optional, for future optimization)
  3. Frontend must fetch related data separately, not via FK joins
  
  ## Schema Design
  - reference_type (text) - Indicates the type: 'invoice', 'expense', 'transfer', 'other'
  - reference_id (uuid) - The ID of the referenced record
  - NO foreign key constraint (by design - polymorphic pattern)
  
  ## Query Pattern
  Instead of:
    SELECT *, invoices:reference_id (invoice_number) FROM transactions
  
  Use:
    SELECT * FROM transactions
    Then fetch related records separately based on reference_type
*/

-- =====================================================
-- Add Documentation Comments
-- =====================================================

COMMENT ON COLUMN transactions.reference_type IS 
  'Type of the referenced entity: invoice, expense, transfer, or other. Used with reference_id for polymorphic relationships.';

COMMENT ON COLUMN transactions.reference_id IS 
  'UUID of the referenced entity. This is a polymorphic reference - it can point to different tables based on reference_type. NO foreign key constraint by design. Query related data separately in application code.';

-- =====================================================
-- Create Helper View for Transactions with Invoice Info
-- =====================================================

-- Drop view if exists
DROP VIEW IF EXISTS transactions_with_invoice_details;

-- Create materialized-friendly view for common transaction queries
CREATE OR REPLACE VIEW transactions_with_invoice_details AS
SELECT 
  t.id,
  t.tenant_id,
  t.account_id,
  t.transaction_type,
  t.amount,
  t.currency,
  t.transaction_date,
  t.description,
  t.reference_type,
  t.reference_id,
  t.customer_id,
  t.payment_method,
  t.notes,
  t.created_at,
  -- Join invoice data only when reference_type = 'invoice'
  CASE 
    WHEN t.reference_type = 'invoice' THEN i.invoice_number
    ELSE NULL
  END as invoice_number,
  CASE 
    WHEN t.reference_type = 'invoice' THEN i.status
    ELSE NULL
  END as invoice_status
FROM transactions t
LEFT JOIN invoices i 
  ON t.reference_type = 'invoice' 
  AND t.reference_id = i.id 
  AND t.tenant_id = i.tenant_id;

COMMENT ON VIEW transactions_with_invoice_details IS 
  'Helper view for querying transactions with invoice details. Use this view instead of trying to join on reference_id directly.';

-- =====================================================
-- Add Index for Common Query Patterns
-- =====================================================

-- Index for filtering by reference type and ID
CREATE INDEX IF NOT EXISTS idx_transactions_reference 
  ON transactions(tenant_id, reference_type, reference_id) 
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_range 
  ON transactions(tenant_id, transaction_date DESC, created_at DESC);

-- =====================================================
-- Data Integrity Check Functions
-- =====================================================

-- Function to validate reference integrity (called manually or via cron)
CREATE OR REPLACE FUNCTION validate_transaction_references()
RETURNS TABLE (
  transaction_id uuid,
  reference_type text,
  reference_id uuid,
  issue text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check for orphaned invoice references
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.reference_type,
    t.reference_id,
    'Referenced invoice does not exist' as issue
  FROM transactions t
  WHERE t.reference_type = 'invoice'
    AND t.reference_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = t.reference_id 
      AND i.tenant_id = t.tenant_id
    );
  
  -- Check for orphaned expense references
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.reference_type,
    t.reference_id,
    'Referenced expense does not exist' as issue
  FROM transactions t
  WHERE t.reference_type = 'expense'
    AND t.reference_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM expenses e 
      WHERE e.id = t.reference_id 
      AND e.tenant_id = t.tenant_id
    );
END;
$$;

COMMENT ON FUNCTION validate_transaction_references() IS 
  'Validates that all transaction references point to existing records. Run periodically to check data integrity.';

-- =====================================================
-- Update Existing Data Quality
-- =====================================================

-- Standardize reference_type values
UPDATE transactions 
SET reference_type = LOWER(reference_type) 
WHERE reference_type IS NOT NULL;

-- Ensure reference_type is set when reference_id exists
UPDATE transactions 
SET reference_type = 'other' 
WHERE reference_id IS NOT NULL 
  AND (reference_type IS NULL OR reference_type = '');

-- =====================================================
-- Add Check Constraint for Valid Reference Types
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'transactions_valid_reference_type'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_valid_reference_type 
    CHECK (reference_type IN ('invoice', 'expense', 'transfer', 'other') OR reference_type IS NULL);
  END IF;
END $$;

-- =====================================================
-- Grant Permissions on View
-- =====================================================

-- Grant access to authenticated users (adjust as needed for your RLS setup)
GRANT SELECT ON transactions_with_invoice_details TO authenticated;

-- Enable RLS on the view (inherits from underlying tables)
ALTER VIEW transactions_with_invoice_details SET (security_invoker = true);
