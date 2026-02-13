/*
  # Add Change History Table for Accounting Knowledge Base

  Per documentation requirements (Dokuman 4 - Bilgi Tabani Yapilandirmasi),
  adding a dedicated change_history table to track legislation amendments.

  1. New Table
    - `accounting_kb_change_history` - Amendment history for documents
      - `id` (serial, PK)
      - `document_id` (text, FK to accounting_kb_documents)
      - `amendment_date` (date)
      - `amendment_text` (text)
      - `gazette_number` (text)
      - `gazette_date` (date)
      - `created_at`

  2. Security
    - RLS enabled
    - Read access for authenticated users
*/

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

CREATE POLICY "accounting_kb_change_history_select"
  ON accounting_kb_change_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "accounting_kb_change_history_insert"
  ON accounting_kb_change_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
