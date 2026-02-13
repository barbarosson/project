/*
  # Create Accounting AI Agent System (Muhasebe Mevzuati Gorus Bildirme AI Agent)

  A comprehensive Turkish accounting legislation advisory AI system with
  knowledge base, chat history, quality metrics, and user feedback.

  1. New Tables
    - `accounting_kb_categories` - Knowledge base category tree
      - `id` (serial, PK)
      - `name` (text)
      - `code` (text)
      - `parent_id` (int, self-ref FK)
      - `description` (text)

    - `accounting_kb_documents` - Legal/regulatory document entries
      - `id` (text, PK) e.g. "VUK_M257_2024"
      - `tenant_id` (uuid, nullable - null means global/shared)
      - `title` (text)
      - `source_law` (text)
      - `source_law_code` (text)
      - `article_number` (text)
      - `article_title` (text)
      - `full_text` (text)
      - `summary` (text)
      - `published_date` (date)
      - `effective_date` (date)
      - `last_amended_date` (date)
      - `gazette_number` (text)
      - `gazette_date` (date)
      - `status` (text: active/obsolete/superseded)
      - `applicable_standards` (text[])
      - `related_article_ids` (text[])
      - `metadata` (jsonb)

    - `accounting_kb_doc_categories` - M:N link between docs and categories
      - `document_id` (text, FK)
      - `category_id` (int, FK)

    - `accounting_ai_threads` - Chat conversation threads
      - `id` (uuid, PK)
      - `tenant_id` (uuid)
      - `title` (text)
      - `created_at` / `updated_at`

    - `accounting_ai_messages` - Individual messages in threads
      - `id` (uuid, PK)
      - `thread_id` (uuid, FK)
      - `tenant_id` (uuid)
      - `role` (text: user/assistant/system)
      - `content` (text)
      - `sources_cited` (jsonb) - Array of cited legislation
      - `response_quality` (jsonb) - Automated quality score
      - `created_at`

    - `accounting_ai_feedback` - User feedback per message
      - `id` (uuid, PK)
      - `message_id` (uuid, FK)
      - `tenant_id` (uuid)
      - `solved_problem` (text: yes/partial/no)
      - `is_accurate` (text: yes/uncertain/no)
      - `is_clear` (text: very_clear/normal/unclear)
      - `comment` (text)
      - `created_at`

    - `accounting_ai_quality_metrics` - Aggregated quality metrics
      - `id` (uuid, PK)
      - `period_start` (date)
      - `period_end` (date)
      - `total_queries` (int)
      - `error_level_1` (int)
      - `error_level_2` (int)
      - `error_level_3` (int)
      - `error_level_4` (int)
      - `avg_response_time_ms` (int)
      - `user_satisfaction_avg` (numeric)
      - `created_at`

  2. Security
    - RLS enabled on all tables
    - Tenant-isolated policies
    - KB documents with null tenant_id are globally readable
*/

-- ============================================================
-- 1. KNOWLEDGE BASE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_kb_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  parent_id int REFERENCES accounting_kb_categories(id) ON DELETE SET NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounting_kb_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_kb_categories_select"
  ON accounting_kb_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "accounting_kb_categories_insert"
  ON accounting_kb_categories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. KNOWLEDGE BASE DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_kb_documents (
  id text PRIMARY KEY,
  tenant_id uuid,
  title text NOT NULL,
  source_law text DEFAULT '',
  source_law_code text DEFAULT '',
  article_number text DEFAULT '',
  article_title text DEFAULT '',
  full_text text DEFAULT '',
  summary text DEFAULT '',
  published_date date,
  effective_date date,
  last_amended_date date,
  gazette_number text DEFAULT '',
  gazette_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'obsolete', 'superseded')),
  applicable_standards text[] DEFAULT '{}',
  related_article_ids text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_kb_docs_status ON accounting_kb_documents(status);
CREATE INDEX IF NOT EXISTS idx_accounting_kb_docs_law ON accounting_kb_documents(source_law_code);
CREATE INDEX IF NOT EXISTS idx_accounting_kb_docs_tenant ON accounting_kb_documents(tenant_id);

ALTER TABLE accounting_kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_kb_documents_select"
  ON accounting_kb_documents FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
  );

CREATE POLICY "accounting_kb_documents_insert"
  ON accounting_kb_documents FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
  );

CREATE POLICY "accounting_kb_documents_update"
  ON accounting_kb_documents FOR UPDATE TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
  )
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')
  );

-- ============================================================
-- 3. DOCUMENT-CATEGORY MAPPING
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_kb_doc_categories (
  document_id text NOT NULL REFERENCES accounting_kb_documents(id) ON DELETE CASCADE,
  category_id int NOT NULL REFERENCES accounting_kb_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);

ALTER TABLE accounting_kb_doc_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_kb_doc_categories_select"
  ON accounting_kb_doc_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "accounting_kb_doc_categories_insert"
  ON accounting_kb_doc_categories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. AI CHAT THREADS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_ai_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_ai_threads_tenant ON accounting_ai_threads(tenant_id);

ALTER TABLE accounting_ai_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_ai_threads_select"
  ON accounting_ai_threads FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "accounting_ai_threads_insert"
  ON accounting_ai_threads FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "accounting_ai_threads_update"
  ON accounting_ai_threads FOR UPDATE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "accounting_ai_threads_delete"
  ON accounting_ai_threads FOR DELETE TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 5. AI CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES accounting_ai_threads(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL DEFAULT '',
  sources_cited jsonb DEFAULT '[]',
  response_quality jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_ai_messages_thread ON accounting_ai_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_accounting_ai_messages_tenant ON accounting_ai_messages(tenant_id);

ALTER TABLE accounting_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_ai_messages_select"
  ON accounting_ai_messages FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "accounting_ai_messages_insert"
  ON accounting_ai_messages FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 6. USER FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS accounting_ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES accounting_ai_messages(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  solved_problem text DEFAULT 'yes' CHECK (solved_problem IN ('yes', 'partial', 'no')),
  is_accurate text DEFAULT 'yes' CHECK (is_accurate IN ('yes', 'uncertain', 'no')),
  is_clear text DEFAULT 'very_clear' CHECK (is_clear IN ('very_clear', 'normal', 'unclear')),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_ai_feedback_message ON accounting_ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_accounting_ai_feedback_tenant ON accounting_ai_feedback(tenant_id);

ALTER TABLE accounting_ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_ai_feedback_select"
  ON accounting_ai_feedback FOR SELECT TO authenticated
  USING (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

CREATE POLICY "accounting_ai_feedback_insert"
  ON accounting_ai_feedback FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = ((auth.jwt() -> 'app_metadata') ->> 'tenant_id'));

-- ============================================================
-- 7. QUALITY METRICS (aggregated weekly/monthly)
-- ============================================================
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

CREATE POLICY "accounting_ai_quality_metrics_select"
  ON accounting_ai_quality_metrics FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "accounting_ai_quality_metrics_insert"
  ON accounting_ai_quality_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 8. SEED INITIAL CATEGORIES
-- ============================================================
INSERT INTO accounting_kb_categories (name, code, description) VALUES
  ('Muhasebe Sistemi', 'MUHASEBE', 'Muhasebe kayit, tasnif ve dosyalama'),
  ('Finansal Raporlama', 'FIN_RAP', 'Bilanco, gelir tablosu ve ek aciklamalar'),
  ('Vergi Muhasebesi', 'VERGI', 'Vergi beyannamesi hazirlama, vergi matrahi hesabi'),
  ('Defterler', 'DEFTER', 'Muhasebe defterleri tutulmasi ve tasdiki'),
  ('Belge Yonetimi', 'BELGE', 'Muhasebe belgelerinin saklanmasi'),
  ('Denetim', 'DENETIM', 'Ic ve bagimsiz denetim gereksinimleri'),
  ('Ozel Konular', 'OZEL', 'Belirli isletme turlerine ozel uygulamalar')
ON CONFLICT DO NOTHING;
