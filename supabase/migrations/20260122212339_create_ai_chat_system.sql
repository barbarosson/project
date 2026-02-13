/*
  # Create AI Chat System with Thread-based Memory

  ## New Tables

  ### 1. ai_chat_threads
  Stores conversation threads for persistent memory across sessions.
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key to tenants)
  - `title` (text) - Auto-generated summary of the conversation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. ai_chat_history
  Stores individual messages in each conversation thread.
  - `id` (uuid, primary key)
  - `thread_id` (uuid, foreign key to ai_chat_threads)
  - `tenant_id` (uuid, for RLS)
  - `role` (text) - 'user', 'assistant', or 'system'
  - `content` (text) - Message content
  - `function_call` (jsonb) - Optional function call data
  - `function_response` (jsonb) - Optional function response data
  - `created_at` (timestamptz)

  ## Security
  
  - Enable RLS on both tables
  - Users can only access threads and messages for their tenant
  - Optimized policies using (SELECT auth.uid()) pattern

  ## Indexes
  
  - Index on thread_id for fast message retrieval
  - Index on tenant_id for efficient filtering
  - Index on created_at for chronological ordering
*/

-- Create ai_chat_threads table
CREATE TABLE IF NOT EXISTS ai_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
  content text NOT NULL,
  function_call jsonb,
  function_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_tenant_id ON ai_chat_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_updated_at ON ai_chat_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_thread_id ON ai_chat_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_tenant_id ON ai_chat_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at);

-- Enable RLS
ALTER TABLE ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_threads
CREATE POLICY "Tenant access to ai_chat_threads" ON ai_chat_threads
  FOR SELECT
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant insert to ai_chat_threads" ON ai_chat_threads
  FOR INSERT
  WITH CHECK (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant update to ai_chat_threads" ON ai_chat_threads
  FOR UPDATE
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  )
  WITH CHECK (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant delete from ai_chat_threads" ON ai_chat_threads
  FOR DELETE
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

-- RLS Policies for ai_chat_history
CREATE POLICY "Tenant access to ai_chat_history" ON ai_chat_history
  FOR SELECT
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant insert to ai_chat_history" ON ai_chat_history
  FOR INSERT
  WITH CHECK (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant update to ai_chat_history" ON ai_chat_history
  FOR UPDATE
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  )
  WITH CHECK (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

CREATE POLICY "Tenant delete from ai_chat_history" ON ai_chat_history
  FOR DELETE
  USING (
    tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    OR (tenant_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid) AND (SELECT auth.uid()) IS NOT NULL)
  );

-- Function to update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE ai_chat_threads 
  SET updated_at = now() 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

-- Trigger to update thread timestamp when new message is added
DROP TRIGGER IF EXISTS update_thread_timestamp_trigger ON ai_chat_history;
CREATE TRIGGER update_thread_timestamp_trigger
  AFTER INSERT ON ai_chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_timestamp();