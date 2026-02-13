/*
  # Optimize AI Chat RLS Policies
  
  1. Changes
    - Drop complex RLS policies on ai_chat_threads and ai_chat_history
    - Create simplified policies that work with the public dev tenant
    - Use simpler conditions to reduce database overhead
    
  2. Security
    - Public dev tenant (00000000-0000-0000-0000-000000000001) has full access
    - This enables the AI chat to work without authentication issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Tenant access to ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Tenant insert to ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Tenant update to ai_chat_threads" ON ai_chat_threads;
DROP POLICY IF EXISTS "Tenant delete from ai_chat_threads" ON ai_chat_threads;

DROP POLICY IF EXISTS "Tenant access to ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Tenant insert to ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Tenant update to ai_chat_history" ON ai_chat_history;
DROP POLICY IF EXISTS "Tenant delete from ai_chat_history" ON ai_chat_history;

-- Create simplified policies for ai_chat_threads
CREATE POLICY "Public dev tenant full access to threads"
  ON ai_chat_threads
  FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create simplified policies for ai_chat_history
CREATE POLICY "Public dev tenant full access to history"
  ON ai_chat_history
  FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
