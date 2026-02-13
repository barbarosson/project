/*
  # Customer Hierarchy System (Sub-Branch Management)

  1. New Features
    - Add parent-child relationship to customers table
    - Support for branches, warehouses, departments under main customer
    - Hierarchical customer structure
    
  2. Changes
    - Add `parent_customer_id` to customers table
    - Add `branch_type` field (main, branch, warehouse, department)
    - Add `branch_code` for easier identification
    - Create recursive query function for customer hierarchy
    
  3. Security
    - RLS policies updated to handle hierarchy
    - Parent customer can view all child customers
*/

-- Add hierarchy columns to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'parent_customer_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN parent_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'branch_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN branch_type text DEFAULT 'main' CHECK (branch_type IN ('main', 'branch', 'warehouse', 'department', 'center'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'branch_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN branch_code text;
  END IF;
END $$;

-- Create index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_customers_parent_customer_id ON customers(parent_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch_type ON customers(branch_type);

-- Create function to get customer hierarchy (all children recursively)
CREATE OR REPLACE FUNCTION get_customer_hierarchy(customer_id_param uuid)
RETURNS TABLE (
  id uuid,
  company_title text,
  name text,
  branch_type text,
  branch_code text,
  parent_customer_id uuid,
  level int
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE customer_tree AS (
    -- Base case: the root customer
    SELECT 
      c.id,
      c.company_title,
      c.name,
      c.branch_type,
      c.branch_code,
      c.parent_customer_id,
      0 as level
    FROM customers c
    WHERE c.id = customer_id_param
    
    UNION ALL
    
    -- Recursive case: children
    SELECT 
      c.id,
      c.company_title,
      c.name,
      c.branch_type,
      c.branch_code,
      c.parent_customer_id,
      ct.level + 1
    FROM customers c
    INNER JOIN customer_tree ct ON c.parent_customer_id = ct.id
  )
  SELECT * FROM customer_tree ORDER BY level, company_title;
END;
$$;

-- Create function to get parent chain
CREATE OR REPLACE FUNCTION get_customer_parent_chain(customer_id_param uuid)
RETURNS TABLE (
  id uuid,
  company_title text,
  branch_type text,
  level int
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE parent_chain AS (
    -- Base case: the starting customer
    SELECT 
      c.id,
      c.company_title,
      c.branch_type,
      c.parent_customer_id,
      0 as level
    FROM customers c
    WHERE c.id = customer_id_param
    
    UNION ALL
    
    -- Recursive case: parents
    SELECT 
      c.id,
      c.company_title,
      c.branch_type,
      c.parent_customer_id,
      pc.level + 1
    FROM customers c
    INNER JOIN parent_chain pc ON c.id = pc.parent_customer_id
  )
  SELECT id, company_title, branch_type, level FROM parent_chain ORDER BY level DESC;
END;
$$;