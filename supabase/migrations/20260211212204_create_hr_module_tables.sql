/*
  # Create HR Module Tables
  
  1. New Tables
    - `staff` - Employee management
      - id, tenant_id, name, email, phone
      - department, position, hire_date
      - salary, performance_score
      - burnout_risk, churn_risk, status
      - manager_id, created_at, updated_at
    
    - `salary_definitions` - Salary structures
      - id, tenant_id, name
      - base_salary, food_allowance, transport_allowance
      - housing_allowance, other_allowances
      - is_active, created_at, updated_at
    
    - `payroll` - Payroll processing
      - id, tenant_id, period, status
      - total_gross, total_net
      - total_sgk_employee, total_sgk_employer
      - total_income_tax, total_stamp_tax
      - employee_count
      - approved_by, approved_at, paid_at
      - created_at, updated_at
    
    - `payroll_items` - Individual payroll entries
      - id, tenant_id, payroll_id, staff_id
      - gross_salary, sgk_employee, sgk_employer
      - income_tax, stamp_tax, net_salary
      - bonus, deductions
      - overtime_hours, overtime_pay
      - created_at
  
  2. Security
    - Enable RLS on all tables
    - Tenant-based access control
    - Super admin full access
*/

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  department text NOT NULL,
  position text NOT NULL,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  salary numeric DEFAULT 0,
  performance_score numeric DEFAULT 0,
  burnout_risk text DEFAULT 'low',
  churn_risk text DEFAULT 'low',
  status text DEFAULT 'active',
  manager_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create salary_definitions table
CREATE TABLE IF NOT EXISTS salary_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  base_salary numeric NOT NULL,
  food_allowance numeric DEFAULT 0,
  transport_allowance numeric DEFAULT 0,
  housing_allowance numeric DEFAULT 0,
  other_allowances numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  period text NOT NULL,
  status text DEFAULT 'draft',
  total_gross numeric DEFAULT 0,
  total_net numeric DEFAULT 0,
  total_sgk_employee numeric DEFAULT 0,
  total_sgk_employer numeric DEFAULT 0,
  total_income_tax numeric DEFAULT 0,
  total_stamp_tax numeric DEFAULT 0,
  employee_count integer DEFAULT 0,
  approved_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payroll_items table
CREATE TABLE IF NOT EXISTS payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  payroll_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  gross_salary numeric NOT NULL,
  sgk_employee numeric DEFAULT 0,
  sgk_employer numeric DEFAULT 0,
  income_tax numeric DEFAULT 0,
  stamp_tax numeric DEFAULT 0,
  net_salary numeric NOT NULL,
  bonus numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  overtime_pay numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Users can view own tenant staff'
  ) THEN
    CREATE POLICY "Users can view own tenant staff"
      ON staff FOR SELECT
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Users can insert own tenant staff'
  ) THEN
    CREATE POLICY "Users can insert own tenant staff"
      ON staff FOR INSERT
      TO authenticated
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Users can update own tenant staff'
  ) THEN
    CREATE POLICY "Users can update own tenant staff"
      ON staff FOR UPDATE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin())
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Users can delete own tenant staff'
  ) THEN
    CREATE POLICY "Users can delete own tenant staff"
      ON staff FOR DELETE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for salary_definitions (same pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salary_definitions' AND policyname = 'Users can view own tenant salary_definitions'
  ) THEN
    CREATE POLICY "Users can view own tenant salary_definitions"
      ON salary_definitions FOR SELECT
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salary_definitions' AND policyname = 'Users can insert own tenant salary_definitions'
  ) THEN
    CREATE POLICY "Users can insert own tenant salary_definitions"
      ON salary_definitions FOR INSERT
      TO authenticated
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salary_definitions' AND policyname = 'Users can update own tenant salary_definitions'
  ) THEN
    CREATE POLICY "Users can update own tenant salary_definitions"
      ON salary_definitions FOR UPDATE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin())
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salary_definitions' AND policyname = 'Users can delete own tenant salary_definitions'
  ) THEN
    CREATE POLICY "Users can delete own tenant salary_definitions"
      ON salary_definitions FOR DELETE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for payroll (same pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll' AND policyname = 'Users can view own tenant payroll'
  ) THEN
    CREATE POLICY "Users can view own tenant payroll"
      ON payroll FOR SELECT
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll' AND policyname = 'Users can insert own tenant payroll'
  ) THEN
    CREATE POLICY "Users can insert own tenant payroll"
      ON payroll FOR INSERT
      TO authenticated
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll' AND policyname = 'Users can update own tenant payroll'
  ) THEN
    CREATE POLICY "Users can update own tenant payroll"
      ON payroll FOR UPDATE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin())
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll' AND policyname = 'Users can delete own tenant payroll'
  ) THEN
    CREATE POLICY "Users can delete own tenant payroll"
      ON payroll FOR DELETE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;
END $$;

-- RLS Policies for payroll_items (same pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'Users can view own tenant payroll_items'
  ) THEN
    CREATE POLICY "Users can view own tenant payroll_items"
      ON payroll_items FOR SELECT
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'Users can insert own tenant payroll_items'
  ) THEN
    CREATE POLICY "Users can insert own tenant payroll_items"
      ON payroll_items FOR INSERT
      TO authenticated
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'Users can update own tenant payroll_items'
  ) THEN
    CREATE POLICY "Users can update own tenant payroll_items"
      ON payroll_items FOR UPDATE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin())
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'Users can delete own tenant payroll_items'
  ) THEN
    CREATE POLICY "Users can delete own tenant payroll_items"
      ON payroll_items FOR DELETE
      TO authenticated
      USING (tenant_id = current_setting('app.tenant_id', true) OR is_super_admin());
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_manager_id ON staff(manager_id) WHERE manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_salary_definitions_tenant_id ON salary_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_definitions_active ON salary_definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_payroll_tenant_id ON payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

CREATE INDEX IF NOT EXISTS idx_payroll_items_tenant_id ON payroll_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_id ON payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_staff_id ON payroll_items(staff_id);
