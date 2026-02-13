/*
  # Company Settings Schema

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, unique - one settings record per tenant)
      - `company_name` (text)
      - `company_title` (text - full legal title)
      - `tax_office` (text)
      - `tax_number` (text - VKN/Tax ID)
      - `address` (text)
      - `city` (text)
      - `country` (text)
      - `postal_code` (text)
      - `phone` (text)
      - `email` (text)
      - `website` (text)
      - `iban` (text)
      - `bank_name` (text)
      - `logo_url` (text, nullable - company logo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their tenant's settings
    - Add public policy for dev tenant

  3. Important Notes
    - Each tenant can have only one company_settings record (enforced by unique constraint)
    - Logo URL will be used in invoices, proposals, and sidebar
    - All company information auto-fills into invoice/proposal sender details
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

-- RLS Policies for company_settings
CREATE POLICY "Users can view own tenant company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can insert own tenant company settings"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant company settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant company settings"
  ON company_settings FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Dev tenant policies
CREATE POLICY "Allow dev tenant access to company settings"
  ON company_settings FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Insert default settings for dev tenant
INSERT INTO company_settings (tenant_id, company_name, company_title, email)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Modulus Demo', 'Modulus Demo Company Ltd.', 'demo@modulus.app')
ON CONFLICT (tenant_id) DO NOTHING;
