/*
  # Create Finance Robot Chat System

  1. New Tables
    - `finance_robot_threads`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, not null)
      - `title` (text, default 'New Conversation')
      - `context_snapshot` (jsonb, nullable) - stores financial context at thread creation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `finance_robot_messages`
      - `id` (uuid, primary key)
      - `thread_id` (uuid, FK to finance_robot_threads)
      - `tenant_id` (uuid, not null)
      - `role` (text: user/assistant/system)
      - `content` (text, not null)
      - `metadata` (jsonb, nullable) - for storing analysis data, recommendations etc
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Policies: authenticated users can manage their own data (tenant_id = auth.uid())

  3. Indexes
    - tenant_id, thread_id, updated_at, created_at for fast lookups

  4. Trigger
    - Auto-update thread updated_at when new message is inserted
*/

-- Finance Robot Threads
CREATE TABLE IF NOT EXISTS finance_robot_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  context_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_robot_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own finance robot threads"
  ON finance_robot_threads FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own finance robot threads"
  ON finance_robot_threads FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update own finance robot threads"
  ON finance_robot_threads FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete own finance robot threads"
  ON finance_robot_threads FOR DELETE
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_fr_threads_tenant_id ON finance_robot_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fr_threads_updated_at ON finance_robot_threads(updated_at DESC);

-- Finance Robot Messages
CREATE TABLE IF NOT EXISTS finance_robot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES finance_robot_threads(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_robot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own finance robot messages"
  ON finance_robot_messages FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own finance robot messages"
  ON finance_robot_messages FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete own finance robot messages"
  ON finance_robot_messages FOR DELETE
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_fr_messages_thread_id ON finance_robot_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_fr_messages_tenant_id ON finance_robot_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fr_messages_created_at ON finance_robot_messages(created_at);

-- Auto-update thread timestamp on new message
CREATE OR REPLACE FUNCTION update_fr_thread_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE finance_robot_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_fr_thread_timestamp_trigger'
  ) THEN
    CREATE TRIGGER update_fr_thread_timestamp_trigger
      AFTER INSERT ON finance_robot_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_fr_thread_timestamp();
  END IF;
END $$;
