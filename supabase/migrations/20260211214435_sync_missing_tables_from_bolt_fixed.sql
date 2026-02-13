/*
  # Sync Missing Tables from Bolt Database
  
  This migration adds 6 tables that exist in Bolt local database but are missing in Supabase.
  
  1. New Tables
    - `accounting_kb_change_history` - Amendment history for accounting documents
    - `accounting_kb_doc_categories` - Document-category junction table
    - `accounting_ai_quality_metrics` - AI quality tracking metrics
    - `production_labor` - Production labor tracking
    - `supplier_price_history` - Historical supplier pricing data
    - `turkish_banks` - Reference table for Turkish banks
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate tenant-based or authenticated access policies
*/

-- =============================================
-- 1. accounting_kb_change_history
-- =============================================
CREATE TABLE IF NOT EXISTS accounting_kb_change_history (
  id serial PRIMARY KEY,
  document_id text NOT NULL REFERENCES accounting_kb_documents(id) ON DELETE CASCADE,
  amendment_date date NOT NULL,
  amendment_text text NOT NULL DEFAULT '',
  gazette_number text DEFAULT '',
  gazette_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_kb_change_history_doc ON accounting_kb_change_history(document_id);
CREATE INDEX IF NOT EXISTS idx_accounting_kb_change_history_date ON accounting_kb_change_history(amendment_date);

ALTER TABLE accounting_kb_change_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounting_kb_change_history' AND policyname = 'accounting_kb_change_history_select'
  ) THEN
    CREATE POLICY "accounting_kb_change_history_select"
      ON accounting_kb_change_history FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounting_kb_change_history' AND policyname = 'accounting_kb_change_history_insert'
  ) THEN
    CREATE POLICY "accounting_kb_change_history_insert"
      ON accounting_kb_change_history FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- =============================================
-- 2. accounting_kb_doc_categories (FIXED: category_id is UUID not INT)
-- =============================================
CREATE TABLE IF NOT EXISTS accounting_kb_doc_categories (
  document_id text NOT NULL REFERENCES accounting_kb_documents(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES accounting_kb_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);

ALTER TABLE accounting_kb_doc_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounting_kb_doc_categories' AND policyname = 'accounting_kb_doc_categories_select'
  ) THEN
    CREATE POLICY "accounting_kb_doc_categories_select"
      ON accounting_kb_doc_categories FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounting_kb_doc_categories' AND policyname = 'accounting_kb_doc_categories_insert'
  ) THEN
    CREATE POLICY "accounting_kb_doc_categories_insert"
      ON accounting_kb_doc_categories FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- =============================================
-- 3. accounting_ai_quality_metrics
-- =============================================
CREATE TABLE IF NOT EXISTS accounting_ai_quality_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_queries int NOT NULL DEFAULT 0,
  error_level_1 int NOT NULL DEFAULT 0,
  error_level_2 int NOT NULL DEFAULT 0,
  error_level_3 int NOT NULL DEFAULT 0,
  error_level_4 int NOT NULL DEFAULT 0,
  avg_response_time_ms int NOT NULL DEFAULT 0,
  user_satisfaction_avg numeric NOT NULL DEFAULT 0,
  citation_completeness_pct numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounting_ai_quality_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accounting_ai_quality_metrics' AND policyname = 'accounting_ai_quality_metrics_select'
  ) THEN
    CREATE POLICY "accounting_ai_quality_metrics_select"
      ON accounting_ai_quality_metrics FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- 4. production_labor
-- =============================================
CREATE TABLE IF NOT EXISTS production_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  production_order_id uuid REFERENCES production_orders(id) ON DELETE CASCADE,
  worker_name text NOT NULL DEFAULT '',
  hours_worked numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL DEFAULT 0,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_labor_order ON production_labor(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_labor_tenant ON production_labor(tenant_id);

ALTER TABLE production_labor ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'production_labor' AND policyname = 'production_labor_tenant_isolation'
  ) THEN
    CREATE POLICY "production_labor_tenant_isolation"
      ON production_labor FOR ALL TO authenticated
      USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
      WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));
  END IF;
END $$;

-- =============================================
-- 5. supplier_price_history
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_price numeric(15,2) NOT NULL,
  currency text DEFAULT 'TRY',
  order_date date NOT NULL,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_tenant ON supplier_price_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier ON supplier_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON supplier_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON supplier_price_history(order_date DESC);

ALTER TABLE supplier_price_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_price_history' AND policyname = 'Users can view own tenant price history'
  ) THEN
    CREATE POLICY "Users can view own tenant price history" 
      ON supplier_price_history FOR SELECT TO authenticated
      USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_price_history' AND policyname = 'Users can insert own tenant price history'
  ) THEN
    CREATE POLICY "Users can insert own tenant price history" 
      ON supplier_price_history FOR INSERT TO authenticated
      WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));
  END IF;
END $$;

-- =============================================
-- 6. turkish_banks
-- =============================================
CREATE TABLE IF NOT EXISTS turkish_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_code text UNIQUE NOT NULL,
  bank_name text NOT NULL,
  bank_name_short text,
  swift_code text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert major Turkish banks
INSERT INTO turkish_banks (bank_code, bank_name, bank_name_short, swift_code, display_order) 
VALUES
  ('0001', 'Türkiye Cumhuriyet Merkez Bankası', 'TCMB', 'TCMBTR2A', 1),
  ('0010', 'Ziraat Bankası', 'Ziraat', 'TCZBTR2A', 2),
  ('0012', 'Halkbank', 'Halkbank', 'TRHBTR2A', 3),
  ('0015', 'Vakıfbank', 'Vakıfbank', 'TVBATR2A', 4),
  ('0032', 'Türkiye İş Bankası', 'İş Bankası', 'ISBKTRIS', 5),
  ('0046', 'Akbank', 'Akbank', 'AKBKTRIS', 6),
  ('0059', 'Şekerbank', 'Şekerbank', 'SEKBTRIS', 7),
  ('0062', 'Garanti BBVA', 'Garanti', 'TGBATRIS', 8),
  ('0064', 'Türkiye Finans', 'Türkiye Finans', 'TFINTR2A', 9),
  ('0067', 'Yapı Kredi', 'Yapı Kredi', 'YAPITRIS', 10),
  ('0096', 'Turkish Bank', 'Turkish Bank', 'TRKBTRIS', 11),
  ('0099', 'ING Bank', 'ING', 'INGBTRIS', 12),
  ('0103', 'Fibabanka', 'Fibabanka', 'FBNKTRIS', 13),
  ('0108', 'Türk Ekonomi Bankası', 'TEB', 'TEBUTR2A', 14),
  ('0111', 'QNB Finansbank', 'QNB Finansbank', 'FNNBTRIS', 15),
  ('0123', 'HSBC', 'HSBC', 'HSBCTRIS', 16),
  ('0124', 'Denizbank', 'Denizbank', 'DENITRIS', 17),
  ('0134', 'Kuveyt Türk', 'Kuveyt Türk', 'KTEFTRIS', 18),
  ('0143', 'Ziraat Katılım', 'Ziraat Katılım', 'ZKBATRIS', 19),
  ('0146', 'Odea Bank', 'Odea Bank', 'ODEATR2A', 20)
ON CONFLICT (bank_code) DO NOTHING;

ALTER TABLE turkish_banks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'turkish_banks' AND policyname = 'Anyone can view turkish banks'
  ) THEN
    CREATE POLICY "Anyone can view turkish banks"
      ON turkish_banks FOR SELECT
      USING (true);
  END IF;
END $$;
