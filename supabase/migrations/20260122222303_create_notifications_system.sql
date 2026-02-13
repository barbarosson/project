/*
  # Create Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, required)
      - `user_id` (uuid, optional) - for user-specific notifications
      - `type` (text) - notification type: invoice_overdue, low_stock, payment_received, etc.
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `link` (text, optional) - link to source record
      - `is_read` (boolean, default false)
      - `metadata` (jsonb, optional) - additional data (invoice_id, product_id, etc.)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, optional)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for authenticated users to read their tenant's notifications
    - Add policies for marking notifications as read

  3. Indexes
    - Index on tenant_id for fast queries
    - Index on is_read for filtering
    - Index on created_at for sorting
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS Policies
CREATE POLICY "Users can view their tenant's notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update their tenant's notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete their tenant's notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Add comment
COMMENT ON TABLE notifications IS 'System notifications for users - overdue invoices, low stock, etc.';
