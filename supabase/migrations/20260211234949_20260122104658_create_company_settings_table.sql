/*
  # Company Settings Schema

  1. New Tables
    - `company_settings` - Company information for each tenant

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid UNIQUE NOT NULL,
  company_name text NOT NULL DEFAULT '',
  company_title text NOT NULL DEFAULT '',
  tax_office text DEFAULT '',
  tax_number text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  postal_code text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  iban text DEFAULT '',
  bank_name text DEFAULT '',
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON company_settings(tenant_id);

-- Enable Row Level Security
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_settings' AND policyname = 'Users can view company settings') THEN
    EXECUTE 'CREATE POLICY "Users can view company settings" ON company_settings FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_settings' AND policyname = 'Users can insert company settings') THEN
    EXECUTE 'CREATE POLICY "Users can insert company settings" ON company_settings FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_settings' AND policyname = 'Users can update company settings') THEN
    EXECUTE 'CREATE POLICY "Users can update company settings" ON company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;