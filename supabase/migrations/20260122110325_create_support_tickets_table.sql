/*
  # Support Tickets Schema

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenant)
      - `ticket_number` (text, unique - auto-generated like TKT-0001)
      - `subject` (text)
      - `category` (text - Technical, Billing, Feature Request, General)
      - `priority` (text - Low, Medium, High)
      - `status` (text - Open, In Progress, Resolved, Closed)
      - `message` (text)
      - `resolution` (text, nullable)
      - `created_by` (text - user email or name)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their tenant's tickets
    - Add public policy for dev tenant

  3. Important Notes
    - Ticket numbers are auto-generated with a sequence
    - Users can view and create tickets for their tenant
    - Status transitions: Open -> In Progress -> Resolved -> Closed
*/

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  message text NOT NULL,
  resolution text,
  created_by text NOT NULL DEFAULT 'Unknown User',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_id integer;
  ticket_num text;
BEGIN
  next_id := nextval('support_ticket_seq');
  ticket_num := 'TKT-' || LPAD(next_id::text, 5, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tenant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can create own tenant tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can update own tenant tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Users can delete own tenant tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Dev tenant policies
CREATE POLICY "Allow dev tenant access to support tickets"
  ON support_tickets FOR ALL
  TO public
  USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
