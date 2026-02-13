/*
  # Create Executive Assistant System

  1. New Tables
    - `obligation_types` - shared reference table for legal obligation categories
    - `executive_obligations` - legal/regulatory obligation tracking
    - `executive_meetings` - meeting management
    - `executive_meeting_attendees` - meeting participants
    - `executive_reminders` - reminders and alerts

  2. Security
    - Enable RLS on all tables
    - Tenant-based access policies for all data tables
    - obligation_types readable by all authenticated users

  3. Seed Data
    - 15 default Turkish legal obligation types
*/

-- Obligation Types (shared reference table)
CREATE TABLE IF NOT EXISTS obligation_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'yasal',
  default_reminder_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE obligation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read obligation types"
  ON obligation_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Executive Obligations
CREATE TABLE IF NOT EXISTS executive_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  obligation_type_id INTEGER REFERENCES obligation_types(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE NOT NULL,
  frequency TEXT DEFAULT 'once',
  next_due_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  responsible_person TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executive_obligations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exec_obligations_tenant ON executive_obligations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exec_obligations_due_date ON executive_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_exec_obligations_status ON executive_obligations(status);

CREATE POLICY "Users can view own tenant obligations"
  ON executive_obligations FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant obligations"
  ON executive_obligations FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update own tenant obligations"
  ON executive_obligations FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant obligations"
  ON executive_obligations FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Executive Meetings
CREATE TABLE IF NOT EXISTS executive_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT '',
  meeting_type TEXT DEFAULT 'in_person',
  status TEXT DEFAULT 'scheduled',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executive_meetings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exec_meetings_tenant ON executive_meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exec_meetings_start ON executive_meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_exec_meetings_status ON executive_meetings(status);

CREATE POLICY "Users can view own tenant meetings"
  ON executive_meetings FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant meetings"
  ON executive_meetings FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update own tenant meetings"
  ON executive_meetings FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant meetings"
  ON executive_meetings FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Meeting Attendees
CREATE TABLE IF NOT EXISTS executive_meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES executive_meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  attendance_status TEXT DEFAULT 'pending',
  is_organizer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executive_meeting_attendees ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exec_attendees_meeting ON executive_meeting_attendees(meeting_id);

CREATE POLICY "Users can view own tenant meeting attendees"
  ON executive_meeting_attendees FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant meeting attendees"
  ON executive_meeting_attendees FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can update own tenant meeting attendees"
  ON executive_meeting_attendees FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant meeting attendees"
  ON executive_meeting_attendees FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Executive Reminders
CREATE TABLE IF NOT EXISTS executive_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  related_type TEXT DEFAULT '',
  related_id UUID,
  remind_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executive_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exec_reminders_tenant ON executive_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exec_reminders_remind_at ON executive_reminders(remind_at);

CREATE POLICY "Users can view own tenant reminders"
  ON executive_reminders FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant reminders"
  ON executive_reminders FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update own tenant reminders"
  ON executive_reminders FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

CREATE POLICY "Users can delete own tenant reminders"
  ON executive_reminders FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid()));

-- Seed default obligation types
INSERT INTO obligation_types (name, description, category, default_reminder_days) VALUES
  ('Kurumlar Vergisi Beyannamesi', 'Yillik kurumlar vergisi beyannamesi', 'vergi', 30),
  ('KDV Beyannamesi', 'Aylik KDV beyannamesi', 'vergi', 7),
  ('Gelir Vergisi Stopaji', 'Aylik gelir vergisi stopaji bildirimi', 'vergi', 7),
  ('Isci Sigorta Primleri', 'Aylik isci sigorta primleri odemesi', 'sigorta', 5),
  ('Isveren Sigorta Primleri', 'Aylik isveren sigorta primleri odemesi', 'sigorta', 5),
  ('Mali Musavirlik Raporu', 'Yillik mali musavirlik raporu', 'raporlama', 60),
  ('Muhasebe Kapatma', 'Aylik muhasebe kapatma islemi', 'raporlama', 5),
  ('Yasal Denetim', 'Yillik yasal denetim', 'yasal', 90),
  ('Is Sagligi ve Guvenligi Egitimi', 'Yillik ISG egitimi', 'yasal', 30),
  ('Vergi Levhasi Yenileme', 'Vergi levhasi yenileme', 'yasal', 180),
  ('Ba-Bs Formlari', 'Aylik Ba-Bs formlari bildirimi', 'raporlama', 7),
  ('SGK Bildirgeleri', 'Aylik SGK bildirgeleri', 'sigorta', 5),
  ('Gecici Vergi Beyani', 'Ucaylik gecici vergi beyani', 'vergi', 14),
  ('E-Defter Berati', 'Aylik e-defter berati yukleme', 'raporlama', 10),
  ('Damga Vergisi', 'Aylik damga vergisi bildirimi', 'vergi', 7)
ON CONFLICT DO NOTHING;
