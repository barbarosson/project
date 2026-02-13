/*
  # Create Purchase Invoices and Reference Tables

  1. New Tables
    - `purchase_invoices` - Incoming purchase invoices from suppliers
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, FK to tenants)
      - `supplier_id` (uuid, FK to customers)
      - `invoice_number` (text, unique per tenant)
      - `invoice_date` (date)
      - `due_date` (date, nullable)
      - `subtotal`, `tax_amount`, `total_amount` (numeric)
      - `status` (text: pending/accepted/rejected)
      - `rejection_reason` (text, nullable)
      - `accepted_at`, `accepted_by` (timestamps and user ref)
    - `purchase_invoice_line_items` - Line items for purchase invoices
      - `id` (uuid, primary key)
      - `tenant_id` (uuid)
      - `purchase_invoice_id` (uuid, FK to purchase_invoices)
      - `product_id` (uuid, nullable FK to products)
      - `description`, `quantity`, `unit_price`, `tax_rate`, `tax_amount`, `total`
    - `turkish_provinces` - Reference table for Turkey's 81 provinces
      - `id` (uuid, primary key)
      - `plate_code` (text, unique)
      - `province_name` (text)
      - `region` (text)

  2. Security
    - RLS enabled on all tables
    - Tenant-scoped access for purchase tables
    - Read-only access for turkish_provinces
*/

-- =============================================
-- 1. purchase_invoices
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  xml_content text,
  html_preview text,
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_invoices_tenant_number_unique UNIQUE (tenant_id, invoice_number)
);

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert purchase invoices for own tenant"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tenant purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tenant purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- =============================================
-- 2. purchase_invoice_line_items
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  purchase_invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 18,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE purchase_invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant purchase invoice items"
  ON purchase_invoice_line_items FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert purchase invoice items for own tenant"
  ON purchase_invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tenant purchase invoice items"
  ON purchase_invoice_line_items FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tenant purchase invoice items"
  ON purchase_invoice_line_items FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- =============================================
-- 3. turkish_provinces
-- =============================================
CREATE TABLE IF NOT EXISTS turkish_provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_code text NOT NULL,
  province_name text NOT NULL,
  region text,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT turkish_provinces_plate_code_unique UNIQUE (plate_code)
);

ALTER TABLE turkish_provinces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view turkish provinces"
  ON turkish_provinces FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_id ON purchase_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_invoice_id ON purchase_invoice_line_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_line_items_tenant_id ON purchase_invoice_line_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_turkish_provinces_name ON turkish_provinces(province_name);

-- =============================================
-- Seed Turkish provinces
-- =============================================
INSERT INTO turkish_provinces (plate_code, province_name, region, display_order) VALUES
  ('01', 'Adana', 'Akdeniz', 1),
  ('02', 'Adıyaman', 'Güneydoğu Anadolu', 2),
  ('03', 'Afyonkarahisar', 'Ege', 3),
  ('04', 'Ağrı', 'Doğu Anadolu', 4),
  ('05', 'Amasya', 'Karadeniz', 5),
  ('06', 'Ankara', 'İç Anadolu', 6),
  ('07', 'Antalya', 'Akdeniz', 7),
  ('08', 'Artvin', 'Karadeniz', 8),
  ('09', 'Aydın', 'Ege', 9),
  ('10', 'Balıkesir', 'Marmara', 10),
  ('11', 'Bilecik', 'Marmara', 11),
  ('12', 'Bingöl', 'Doğu Anadolu', 12),
  ('13', 'Bitlis', 'Doğu Anadolu', 13),
  ('14', 'Bolu', 'Karadeniz', 14),
  ('15', 'Burdur', 'Akdeniz', 15),
  ('16', 'Bursa', 'Marmara', 16),
  ('17', 'Çanakkale', 'Marmara', 17),
  ('18', 'Çankırı', 'İç Anadolu', 18),
  ('19', 'Çorum', 'Karadeniz', 19),
  ('20', 'Denizli', 'Ege', 20),
  ('21', 'Diyarbakır', 'Güneydoğu Anadolu', 21),
  ('22', 'Edirne', 'Marmara', 22),
  ('23', 'Elazığ', 'Doğu Anadolu', 23),
  ('24', 'Erzincan', 'Doğu Anadolu', 24),
  ('25', 'Erzurum', 'Doğu Anadolu', 25),
  ('26', 'Eskişehir', 'İç Anadolu', 26),
  ('27', 'Gaziantep', 'Güneydoğu Anadolu', 27),
  ('28', 'Giresun', 'Karadeniz', 28),
  ('29', 'Gümüşhane', 'Karadeniz', 29),
  ('30', 'Hakkâri', 'Doğu Anadolu', 30),
  ('31', 'Hatay', 'Akdeniz', 31),
  ('32', 'Isparta', 'Akdeniz', 32),
  ('33', 'Mersin', 'Akdeniz', 33),
  ('34', 'İstanbul', 'Marmara', 34),
  ('35', 'İzmir', 'Ege', 35),
  ('36', 'Kars', 'Doğu Anadolu', 36),
  ('37', 'Kastamonu', 'Karadeniz', 37),
  ('38', 'Kayseri', 'İç Anadolu', 38),
  ('39', 'Kırklareli', 'Marmara', 39),
  ('40', 'Kırşehir', 'İç Anadolu', 40),
  ('41', 'Kocaeli', 'Marmara', 41),
  ('42', 'Konya', 'İç Anadolu', 42),
  ('43', 'Kütahya', 'Ege', 43),
  ('44', 'Malatya', 'Doğu Anadolu', 44),
  ('45', 'Manisa', 'Ege', 45),
  ('46', 'Kahramanmaraş', 'Akdeniz', 46),
  ('47', 'Mardin', 'Güneydoğu Anadolu', 47),
  ('48', 'Muğla', 'Ege', 48),
  ('49', 'Muş', 'Doğu Anadolu', 49),
  ('50', 'Nevşehir', 'İç Anadolu', 50),
  ('51', 'Niğde', 'İç Anadolu', 51),
  ('52', 'Ordu', 'Karadeniz', 52),
  ('53', 'Rize', 'Karadeniz', 53),
  ('54', 'Sakarya', 'Marmara', 54),
  ('55', 'Samsun', 'Karadeniz', 55),
  ('56', 'Siirt', 'Güneydoğu Anadolu', 56),
  ('57', 'Sinop', 'Karadeniz', 57),
  ('58', 'Sivas', 'İç Anadolu', 58),
  ('59', 'Tekirdağ', 'Marmara', 59),
  ('60', 'Tokat', 'Karadeniz', 60),
  ('61', 'Trabzon', 'Karadeniz', 61),
  ('62', 'Tunceli', 'Doğu Anadolu', 62),
  ('63', 'Şanlıurfa', 'Güneydoğu Anadolu', 63),
  ('64', 'Uşak', 'Ege', 64),
  ('65', 'Van', 'Doğu Anadolu', 65),
  ('66', 'Yozgat', 'İç Anadolu', 66),
  ('67', 'Zonguldak', 'Karadeniz', 67),
  ('68', 'Aksaray', 'İç Anadolu', 68),
  ('69', 'Bayburt', 'Karadeniz', 69),
  ('70', 'Karaman', 'İç Anadolu', 70),
  ('71', 'Kırıkkale', 'İç Anadolu', 71),
  ('72', 'Batman', 'Güneydoğu Anadolu', 72),
  ('73', 'Şırnak', 'Güneydoğu Anadolu', 73),
  ('74', 'Bartın', 'Karadeniz', 74),
  ('75', 'Ardahan', 'Doğu Anadolu', 75),
  ('76', 'Iğdır', 'Doğu Anadolu', 76),
  ('77', 'Yalova', 'Marmara', 77),
  ('78', 'Karabük', 'Karadeniz', 78),
  ('79', 'Kilis', 'Güneydoğu Anadolu', 79),
  ('80', 'Osmaniye', 'Akdeniz', 80),
  ('81', 'Düzce', 'Karadeniz', 81)
ON CONFLICT (plate_code) DO NOTHING;
