-- DentalFlow autonomous growth system core schema
-- This migration is isolated under the dentalflow schema to avoid collisions.

create schema if not exists dentalflow;

create table if not exists dentalflow.clinics (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  clinic_name text not null,
  city text,
  district text,
  whatsapp_number text,
  instagram_handle text,
  timezone text not null default 'Europe/Istanbul',
  onboarding_status text not null default 'pending'
    check (onboarding_status in ('pending', 'running', 'active', 'blocked')),
  subscription_plan text not null default 'starter'
    check (subscription_plan in ('starter', 'growth', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentalflow.leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentalflow.clinics(id) on delete cascade,
  source text not null check (source in ('website', 'whatsapp', 'instagram', 'ads', 'manual')),
  full_name text,
  phone text,
  email text,
  treatment_interest text,
  lead_score int not null default 0 check (lead_score between 0 and 100),
  lead_segment text not null default 'cold' check (lead_segment in ('cold', 'warm', 'hot')),
  status text not null default 'new'
    check (status in ('new', 'qualified', 'contacted', 'booked', 'lost')),
  consent_marketing boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentalflow.conversations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentalflow.clinics(id) on delete cascade,
  lead_id uuid references dentalflow.leads(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'instagram', 'email', 'webchat')),
  direction text not null check (direction in ('inbound', 'outbound')),
  message_text text not null,
  intent text,
  confidence numeric(5,4),
  created_by_agent text,
  created_at timestamptz not null default now()
);

create table if not exists dentalflow.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentalflow.clinics(id) on delete cascade,
  lead_id uuid references dentalflow.leads(id) on delete set null,
  appointment_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')),
  booking_channel text not null check (booking_channel in ('bot', 'manual')),
  reminder_state text not null default 'queued'
    check (reminder_state in ('queued', 'sent', 'failed', 'not_needed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentalflow.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references dentalflow.clinics(id) on delete cascade,
  billing_provider text not null default 'iyzico'
    check (billing_provider in ('iyzico', 'stripe', 'manual')),
  billing_customer_ref text,
  billing_subscription_ref text,
  status text not null default 'trial'
    check (status in ('trial', 'active', 'past_due', 'cancelled', 'paused')),
  monthly_price_try numeric(12,2) not null default 3900,
  performance_fee_try numeric(12,2) not null default 0,
  next_billing_at timestamptz,
  failed_payment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentalflow.agent_runs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references dentalflow.clinics(id) on delete cascade,
  agent_name text not null check (agent_name in (
    'traffic', 'qualification', 'conversion', 'onboarding', 'messaging',
    'revenue', 'retention', 'billing', 'compliance'
  )),
  trigger_type text not null check (trigger_type in ('schedule', 'event', 'webhook', 'manual')),
  status text not null check (status in ('started', 'completed', 'failed', 'cancelled')),
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists dentalflow.kpi_daily (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentalflow.clinics(id) on delete cascade,
  kpi_date date not null,
  leads_total int not null default 0,
  qualified_leads int not null default 0,
  appointments_total int not null default 0,
  appointments_completed int not null default 0,
  no_show_total int not null default 0,
  revenue_try numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (clinic_id, kpi_date)
);

create table if not exists dentalflow.automation_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dentalflow.clinics(id) on delete cascade,
  rule_name text not null,
  is_enabled boolean not null default true,
  trigger_event text not null,
  condition_json jsonb not null default '{}'::jsonb,
  action_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, rule_name)
);

create index if not exists idx_dentalflow_leads_clinic_status
  on dentalflow.leads(clinic_id, status, lead_score desc);

create index if not exists idx_dentalflow_appointments_clinic_date
  on dentalflow.appointments(clinic_id, appointment_at);

create index if not exists idx_dentalflow_agent_runs_agent_started
  on dentalflow.agent_runs(agent_name, started_at desc);

create index if not exists idx_dentalflow_kpi_daily_clinic_date
  on dentalflow.kpi_daily(clinic_id, kpi_date desc);

create or replace function dentalflow.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dentalflow_clinics_updated_at on dentalflow.clinics;
create trigger trg_dentalflow_clinics_updated_at
before update on dentalflow.clinics
for each row execute function dentalflow.set_updated_at();

drop trigger if exists trg_dentalflow_leads_updated_at on dentalflow.leads;
create trigger trg_dentalflow_leads_updated_at
before update on dentalflow.leads
for each row execute function dentalflow.set_updated_at();

drop trigger if exists trg_dentalflow_appointments_updated_at on dentalflow.appointments;
create trigger trg_dentalflow_appointments_updated_at
before update on dentalflow.appointments
for each row execute function dentalflow.set_updated_at();

drop trigger if exists trg_dentalflow_subscriptions_updated_at on dentalflow.subscriptions;
create trigger trg_dentalflow_subscriptions_updated_at
before update on dentalflow.subscriptions
for each row execute function dentalflow.set_updated_at();

drop trigger if exists trg_dentalflow_automation_rules_updated_at on dentalflow.automation_rules;
create trigger trg_dentalflow_automation_rules_updated_at
before update on dentalflow.automation_rules
for each row execute function dentalflow.set_updated_at();

alter table dentalflow.clinics enable row level security;
alter table dentalflow.leads enable row level security;
alter table dentalflow.conversations enable row level security;
alter table dentalflow.appointments enable row level security;
alter table dentalflow.subscriptions enable row level security;
alter table dentalflow.agent_runs enable row level security;
alter table dentalflow.kpi_daily enable row level security;
alter table dentalflow.automation_rules enable row level security;

create policy "clinic owner full access clinics"
on dentalflow.clinics
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "clinic owner full access leads"
on dentalflow.leads
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = leads.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = leads.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access conversations"
on dentalflow.conversations
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = conversations.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = conversations.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access appointments"
on dentalflow.appointments
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = appointments.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = appointments.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access subscriptions"
on dentalflow.subscriptions
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = subscriptions.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = subscriptions.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access agent runs"
on dentalflow.agent_runs
for all
to authenticated
using (
  clinic_id is null
  or exists (
    select 1
    from dentalflow.clinics c
    where c.id = agent_runs.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  clinic_id is null
  or exists (
    select 1
    from dentalflow.clinics c
    where c.id = agent_runs.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access kpi daily"
on dentalflow.kpi_daily
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = kpi_daily.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = kpi_daily.clinic_id and c.owner_user_id = auth.uid()
  )
);

create policy "clinic owner full access automation rules"
on dentalflow.automation_rules
for all
to authenticated
using (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = automation_rules.clinic_id and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from dentalflow.clinics c
    where c.id = automation_rules.clinic_id and c.owner_user_id = auth.uid()
  )
);
