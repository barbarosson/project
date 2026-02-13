/*
  # Create Live Support Chat System

  1. New Tables
    - `support_chat_sessions`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `user_id` (uuid, nullable, references auth.users)
      - `status` (text: 'active', 'closed', 'waiting')
      - `is_read_by_admin` (boolean, tracks if admin has seen new messages)
      - `user_email` (text, for identification)
      - `user_name` (text, for display)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `closed_at` (timestamptz, nullable)
      
    - `support_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references support_chat_sessions)
      - `tenant_id` (uuid, for RLS and querying)
      - `sender_id` (uuid, nullable, references auth.users)
      - `sender_name` (text, cached for display)
      - `message` (text, the message content)
      - `is_admin_reply` (boolean, true if sent by admin)
      - `is_read` (boolean, tracks if message has been read)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only see their own chat sessions and messages
    - Admins can see all chat sessions and messages
    - Public access for dev tenant (demo purposes)
    
  3. Indexes
    - Index on session_id for fast message retrieval
    - Index on tenant_id for multi-tenancy
    - Index on created_at for ordering
    - Index on is_read_by_admin for admin dashboard filtering
*/

-- Create support_chat_sessions table
CREATE TABLE IF NOT EXISTS support_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting')),
  is_read_by_admin boolean NOT NULL DEFAULT false,
  user_email text,
  user_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  is_admin_reply boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_tenant_id 
  ON support_chat_sessions(tenant_id);
  
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id 
  ON support_chat_sessions(user_id);
  
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status 
  ON support_chat_sessions(status);
  
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_is_read_by_admin 
  ON support_chat_sessions(is_read_by_admin) WHERE is_read_by_admin = false;
  
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_updated_at 
  ON support_chat_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_session_id 
  ON support_messages(session_id);
  
CREATE INDEX IF NOT EXISTS idx_support_messages_tenant_id 
  ON support_messages(tenant_id);
  
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at 
  ON support_messages(created_at);
  
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read 
  ON support_messages(is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Admins can view all chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Admins can update all chat sessions" ON support_chat_sessions;
DROP POLICY IF EXISTS "Public access to dev tenant chat sessions" ON support_chat_sessions;

DROP POLICY IF EXISTS "Users can view own messages" ON support_messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON support_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can create messages in any session" ON support_messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON support_messages;
DROP POLICY IF EXISTS "Public access to dev tenant messages" ON support_messages;

-- RLS Policies for support_chat_sessions (Authenticated)
CREATE POLICY "Users can view own chat sessions"
  ON support_chat_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions"
  ON support_chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
  ON support_chat_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies - all authenticated users can act as admins for dev tenant
CREATE POLICY "Admins can view all chat sessions"
  ON support_chat_sessions
  FOR SELECT
  TO authenticated
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Admins can update all chat sessions"
  ON support_chat_sessions
  FOR UPDATE
  TO authenticated
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Public access for dev tenant (demo purposes)
CREATE POLICY "Public access to dev tenant chat sessions"
  ON support_chat_sessions
  FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- RLS Policies for support_messages (Authenticated)
CREATE POLICY "Users can view own messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_chat_sessions
      WHERE support_chat_sessions.id = support_messages.session_id
      AND support_chat_sessions.user_id = auth.uid()
    )
  );

-- Admin policies for messages
CREATE POLICY "Admins can view all messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Admins can create messages in any session"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Admins can update all messages"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Public access for dev tenant messages (demo purposes)
CREATE POLICY "Public access to dev tenant messages"
  ON support_messages
  FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_support_chat_sessions_updated_at ON support_chat_sessions;
CREATE TRIGGER trigger_update_support_chat_sessions_updated_at
  BEFORE UPDATE ON support_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_support_chat_session_updated_at();

-- Create function to update session updated_at when new message is added
CREATE OR REPLACE FUNCTION update_session_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_chat_sessions
  SET updated_at = now(),
      is_read_by_admin = CASE 
        WHEN NEW.is_admin_reply = false THEN false
        ELSE is_read_by_admin
      END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating session on new message
DROP TRIGGER IF EXISTS trigger_update_session_on_message ON support_messages;
CREATE TRIGGER trigger_update_session_on_message
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_new_message();
