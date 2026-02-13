/*
  # Fix Live Support Admin Message Policy
  
  1. Changes
    - Fix admin message creation policy to work with all tenants
    - Admin should be able to send messages to any session in their tenant
    - Remove the dev-tenant-only restriction
    
  2. Security
    - Maintain RLS protection
    - Admins can only send messages in sessions within their tenant
*/

-- Drop and recreate the admin message creation policy
DROP POLICY IF EXISTS "Admins can create messages in any session" ON support_messages;

-- New policy: Admins can create messages in sessions within their tenant
CREATE POLICY "Admins can create messages in any session"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.tenant_id = support_messages.tenant_id
    )
  );

-- Also update the view and update policies for consistency
DROP POLICY IF EXISTS "Admins can view all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON support_messages;

CREATE POLICY "Admins can view all messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.tenant_id = support_messages.tenant_id
    )
  );

CREATE POLICY "Admins can update all messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.tenant_id = support_messages.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.tenant_id = support_messages.tenant_id
    )
  );