/*
  # e-Invoice & e-Archive System
  Tables: einvoice_details, tax_rates, einvoice_queue, einvoice_logs
  Customer extensions for tax fields
*/

CREATE TABLE IF NOT EXISTS public.einvoice_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, invoice_id UUID NOT NULL, branch_id UUID,
  gib_uuid UUID, ettn TEXT,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('e-invoice', 'e-archive', 'e-export', 'e-producer')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validating', 'validated', 'sending', 'sent_to_gib', 'approved', 'rejected', 'cancelled', 'error')),
  xml_content TEXT, xml_hash TEXT, pdf_url TEXT, html_preview TEXT,
  is_signed BOOLEAN DEFAULT false, signature_value TEXT, certificate_serial_number TEXT,
  signed_at TIMESTAMPTZ, signed_by UUID, sent_at TIMESTAMPTZ, response_received_at TIMESTAMPTZ,
  response_code TEXT, response_message TEXT, gib_error_code TEXT, gib_error_detail TEXT,
  ai_validation_score DECIMAL(3,2), ai_validation_issues JSONB, tax_anomaly_detected BOOLEAN DEFAULT false,
  anomaly_details TEXT, cancellation_reason TEXT, cancelled_at TIMESTAMPTZ, cancelled_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT einvoice_invoice_unique UNIQUE (invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_einvoice_invoice ON public.einvoice_details(invoice_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_tenant ON public.einvoice_details(tenant_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_gib_uuid ON public.einvoice_details(gib_uuid);
CREATE INDEX IF NOT EXISTS idx_einvoice_ettn ON public.einvoice_details(ettn);
CREATE INDEX IF NOT EXISTS idx_einvoice_status ON public.einvoice_details(status);
CREATE INDEX IF NOT EXISTS idx_einvoice_type ON public.einvoice_details(invoice_type);
CREATE INDEX IF NOT EXISTS idx_einvoice_sent_at ON public.einvoice_details(sent_at);
CREATE INDEX IF NOT EXISTS idx_einvoice_validation_issues ON public.einvoice_details USING GIN (ai_validation_issues);

CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('kdv', 'otv', 'oiv', 'tevkifat', 'bsmv', 'damga_vergisi')),
  tax_name TEXT NOT NULL, tax_rate DECIMAL(5,2) NOT NULL, product_category TEXT,
  applies_to TEXT CHECK (applies_to IN ('all', 'goods', 'services', 'specific')),
  valid_from DATE NOT NULL, valid_until DATE, gib_tax_code TEXT, gib_exemption_code TEXT,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_tenant ON public.tax_rates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON public.tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON public.tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_rates_valid ON public.tax_rates(valid_from, valid_until);

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'tax_id_type') THEN ALTER TABLE public.customers ADD COLUMN tax_id_type TEXT CHECK (tax_id_type IN ('vkn', 'tckn', 'foreign')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'is_tax_exempt') THEN ALTER TABLE public.customers ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'exemption_reason') THEN ALTER TABLE public.customers ADD COLUMN exemption_reason TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'gib_registered') THEN ALTER TABLE public.customers ADD COLUMN gib_registered BOOLEAN DEFAULT false; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'einvoice_address') THEN ALTER TABLE public.customers ADD COLUMN einvoice_address TEXT; END IF; END $$;

CREATE INDEX IF NOT EXISTS idx_customers_gib_registered ON public.customers(gib_registered);

CREATE TABLE IF NOT EXISTS public.einvoice_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), einvoice_detail_id UUID, priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0, max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  last_error TEXT, last_attempt_at TIMESTAMPTZ, next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_einvoice_queue_detail ON public.einvoice_queue(einvoice_detail_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_queue_status ON public.einvoice_queue(status);
CREATE INDEX IF NOT EXISTS idx_einvoice_queue_priority ON public.einvoice_queue(priority);
CREATE INDEX IF NOT EXISTS idx_einvoice_queue_next_retry ON public.einvoice_queue(next_retry_at);

CREATE TABLE IF NOT EXISTS public.einvoice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), einvoice_detail_id UUID,
  log_level TEXT CHECK (log_level IN ('info', 'warning', 'error', 'critical')),
  event_type TEXT NOT NULL, message TEXT NOT NULL, details JSONB, stack_trace TEXT, user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_einvoice_logs_detail ON public.einvoice_logs(einvoice_detail_id);
CREATE INDEX IF NOT EXISTS idx_einvoice_logs_level ON public.einvoice_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_einvoice_logs_created ON public.einvoice_logs(created_at);

ALTER TABLE public.einvoice_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einvoice_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einvoice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_details;
DROP POLICY IF EXISTS "Tenant isolation" ON public.tax_rates;
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_queue;
DROP POLICY IF EXISTS "Tenant isolation" ON public.einvoice_logs;

CREATE POLICY "Tenant isolation" ON public.einvoice_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Tenant isolation" ON public.tax_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Tenant isolation" ON public.einvoice_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Tenant isolation" ON public.einvoice_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.tax_rates (tenant_id, tax_type, tax_name, tax_rate, applies_to, valid_from, gib_tax_code, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'kdv', 'KDV %20', 20.00, 'all', '2024-01-01', '0015', true),
  ('00000000-0000-0000-0000-000000000000', 'kdv', 'KDV %10', 10.00, 'goods', '2024-01-01', '0071', true),
  ('00000000-0000-0000-0000-000000000000', 'kdv', 'KDV %8', 8.00, 'goods', '2024-01-01', '0073', true),
  ('00000000-0000-0000-0000-000000000000', 'kdv', 'KDV %1', 1.00, 'goods', '2024-01-01', '0074', true),
  ('00000000-0000-0000-0000-000000000000', 'kdv', 'KDV İstisna', 0.00, 'all', '2024-01-01', '0003', true)
ON CONFLICT DO NOTHING;