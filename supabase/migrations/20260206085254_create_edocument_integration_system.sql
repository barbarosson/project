/*
  # E-Document Integration System (NES Bilgi API)

  1. New Tables
    - `edocument_settings`
      - `id` (uuid, primary key)
      - `tenant_id` (text) - tenant identifier
      - `provider` (text) - integration provider (e.g., 'nes_bilgi')
      - `api_base_url` (text) - base URL for API calls
      - `username` (text) - API username
      - `password_encrypted` (text) - encrypted API password
      - `is_active` (boolean) - whether integration is active
      - `efatura_enabled` (boolean) - e-Fatura module enabled
      - `earsiv_enabled` (boolean) - e-Arsiv module enabled
      - `edespatch_enabled` (boolean) - e-Irsaliye module enabled
      - `esmm_enabled` (boolean) - e-SMM module enabled
      - `emm_enabled` (boolean) - e-MM module enabled
      - `ebook_enabled` (boolean) - e-Defter module enabled
      - `default_series` (text) - default invoice series prefix
      - `company_vkn` (text) - company tax identification number
      - `company_title` (text) - company legal title
      - `created_at` / `updated_at` (timestamptz)

    - `edocuments`
      - `id` (uuid, primary key)
      - `tenant_id` (text) - tenant identifier
      - `document_type` (text) - type: efatura, earsiv, edespatch, esmm, emm, ebook
      - `direction` (text) - incoming or outgoing
      - `ettn` (text) - unique tracking number from GIB
      - `invoice_number` (text) - invoice number
      - `status` (text) - draft, queued, sent, delivered, accepted, rejected, cancelled
      - `sender_vkn` (text) - sender tax number
      - `sender_title` (text) - sender company title
      - `receiver_vkn` (text) - receiver tax number
      - `receiver_title` (text) - receiver company title
      - `issue_date` (date) - document issue date
      - `invoice_type` (text) - SATIS, IADE, TEVKIFAT, ISTISNA, OZELMATRAH, IHRACKAYITLI
      - `currency` (text) - TRY, USD, EUR, GBP
      - `subtotal` (numeric) - amount before tax
      - `tax_total` (numeric) - total tax amount
      - `grand_total` (numeric) - total with tax
      - `notes` (text) - additional notes
      - `ubl_xml` (text) - UBL XML content
      - `html_content` (text) - rendered HTML preview
      - `pdf_url` (text) - PDF download URL
      - `nes_response` (jsonb) - raw response from NES API
      - `error_message` (text) - error details if failed
      - `transferred` (boolean) - marked as transferred to ERP
      - `local_invoice_id` (uuid) - link to local invoices table
      - `created_at` / `updated_at` (timestamptz)

    - `edocument_line_items`
      - `id` (uuid, primary key)
      - `edocument_id` (uuid) - FK to edocuments
      - `tenant_id` (text) - tenant identifier
      - `line_number` (integer) - line sequence number
      - `product_name` (text) - product/service name
      - `product_code` (text) - product code
      - `quantity` (numeric) - quantity
      - `unit_code` (text) - unit code (ADET, KG, LT, etc.)
      - `unit_price` (numeric) - unit price
      - `tax_rate` (numeric) - tax percentage
      - `tax_amount` (numeric) - tax amount
      - `line_total` (numeric) - line total
      - `discount_rate` (numeric) - discount percentage
      - `discount_amount` (numeric) - discount amount

    - `edocument_activity_log`
      - `id` (uuid, primary key)
      - `tenant_id` (text) - tenant identifier
      - `edocument_id` (uuid) - FK to edocuments
      - `action` (text) - action performed
      - `details` (text) - action details
      - `performed_by` (uuid) - user who performed action
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users based on tenant_id
*/

-- E-Document Settings Table
CREATE TABLE IF NOT EXISTS edocument_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  provider text NOT NULL DEFAULT 'nes_bilgi',
  api_base_url text NOT NULL DEFAULT 'https://apitest.nesbilgi.com.tr',
  username text NOT NULL DEFAULT '',
  password_encrypted text NOT NULL DEFAULT '',
  is_active boolean DEFAULT false,
  efatura_enabled boolean DEFAULT false,
  earsiv_enabled boolean DEFAULT false,
  edespatch_enabled boolean DEFAULT false,
  esmm_enabled boolean DEFAULT false,
  emm_enabled boolean DEFAULT false,
  ebook_enabled boolean DEFAULT false,
  default_series text DEFAULT '',
  company_vkn text DEFAULT '',
  company_title text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE edocument_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant edocument settings"
  ON edocument_settings FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant edocument settings"
  ON edocument_settings FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant edocument settings"
  ON edocument_settings FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- E-Documents Table
CREATE TABLE IF NOT EXISTS edocuments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  document_type text NOT NULL DEFAULT 'efatura',
  direction text NOT NULL DEFAULT 'outgoing',
  ettn text,
  invoice_number text,
  status text NOT NULL DEFAULT 'draft',
  sender_vkn text,
  sender_title text,
  receiver_vkn text,
  receiver_title text,
  issue_date date DEFAULT CURRENT_DATE,
  invoice_type text DEFAULT 'SATIS',
  currency text DEFAULT 'TRY',
  subtotal numeric(15,2) DEFAULT 0,
  tax_total numeric(15,2) DEFAULT 0,
  grand_total numeric(15,2) DEFAULT 0,
  notes text,
  ubl_xml text,
  html_content text,
  pdf_url text,
  nes_response jsonb,
  error_message text,
  transferred boolean DEFAULT false,
  local_invoice_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edocuments_tenant_id ON edocuments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edocuments_document_type ON edocuments(document_type);
CREATE INDEX IF NOT EXISTS idx_edocuments_status ON edocuments(status);
CREATE INDEX IF NOT EXISTS idx_edocuments_direction ON edocuments(direction);
CREATE INDEX IF NOT EXISTS idx_edocuments_ettn ON edocuments(ettn);
CREATE INDEX IF NOT EXISTS idx_edocuments_issue_date ON edocuments(issue_date);

ALTER TABLE edocuments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant edocuments"
  ON edocuments FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant edocuments"
  ON edocuments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant edocuments"
  ON edocuments FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant edocuments"
  ON edocuments FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- E-Document Line Items Table
CREATE TABLE IF NOT EXISTS edocument_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edocument_id uuid NOT NULL REFERENCES edocuments(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  line_number integer NOT NULL DEFAULT 1,
  product_name text NOT NULL DEFAULT '',
  product_code text DEFAULT '',
  quantity numeric(15,4) DEFAULT 1,
  unit_code text DEFAULT 'ADET',
  unit_price numeric(15,4) DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20,
  tax_amount numeric(15,2) DEFAULT 0,
  line_total numeric(15,2) DEFAULT 0,
  discount_rate numeric(5,2) DEFAULT 0,
  discount_amount numeric(15,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_edocument_line_items_edocument_id ON edocument_line_items(edocument_id);
CREATE INDEX IF NOT EXISTS idx_edocument_line_items_tenant_id ON edocument_line_items(tenant_id);

ALTER TABLE edocument_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant edocument line items"
  ON edocument_line_items FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant edocument line items"
  ON edocument_line_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can update own tenant edocument line items"
  ON edocument_line_items FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can delete own tenant edocument line items"
  ON edocument_line_items FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- E-Document Activity Log Table
CREATE TABLE IF NOT EXISTS edocument_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  edocument_id uuid REFERENCES edocuments(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edocument_activity_log_tenant_id ON edocument_activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edocument_activity_log_edocument_id ON edocument_activity_log(edocument_id);

ALTER TABLE edocument_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant edocument activity log"
  ON edocument_activity_log FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY "Users can insert own tenant edocument activity log"
  ON edocument_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
