-- ============================================================================
-- Modulus AppointFlow + DentalFlow — birleştirilmiş migration
-- Oluşturulma: 2026-04-17
-- Bu dosya Supabase Dashboard → SQL Editor'e yapıştırılıp RUN edilecek.
-- İçerik (sırayla):
--   1) 20260417110000 — create_dentalflow_autonomous_system
--   2) 20260417120000 — create_apptflow_core
--   3) 20260417130000 — apptflow_service_role_grants
--   4) 20260418100000 — apptflow_lemon_squeezy
-- ============================================================================
BEGIN;


-- ============================================================================
-- MIGRATION: 20260417110000_create_dentalflow_autonomous_system.sql
-- ============================================================================
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


-- ============================================================================
-- MIGRATION: 20260417120000_create_apptflow_core.sql
-- ============================================================================
-- ====================================================================
-- AppointFlow â€” core schema
-- Isolated under the `apptflow` schema. Independent from any other
-- product in this workspace. Multi-tenant, multi-currency, multi-locale.
-- ====================================================================

create schema if not exists apptflow;

-- --------------------------------------------------------------------
-- 0. Supporting lookup tables
-- --------------------------------------------------------------------

create table if not exists apptflow.locales (
  code text primary key,               -- e.g. 'en', 'tr', 'es-MX'
  english_name text not null,
  native_name text not null,
  is_active boolean not null default true
);

insert into apptflow.locales (code, english_name, native_name) values
  ('en', 'English', 'English'),
  ('tr', 'Turkish', 'TÃ¼rkÃ§e'),
  ('es', 'Spanish', 'EspaÃ±ol'),
  ('de', 'German', 'Deutsch'),
  ('fr', 'French', 'FranÃ§ais'),
  ('pt', 'Portuguese', 'PortuguÃªs'),
  ('ar', 'Arabic', 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©'),
  ('it', 'Italian', 'Italiano'),
  ('ru', 'Russian', 'Ğ ÑƒÑÑĞºĞ¸Ğ¹')
on conflict (code) do nothing;

create table if not exists apptflow.currencies (
  code text primary key,               -- ISO 4217: USD, EUR, TRY ...
  symbol text not null,
  decimals int not null default 2,
  is_active boolean not null default true
);

insert into apptflow.currencies (code, symbol, decimals) values
  ('USD', '$', 2), ('EUR', 'â‚¬', 2), ('GBP', 'Â£', 2),
  ('TRY', 'â‚º', 2), ('BRL', 'R$', 2), ('MXN', '$', 2),
  ('AED', 'Ø¯.Ø¥', 2), ('SAR', 'ï·¼', 2), ('JPY', 'Â¥', 0),
  ('CHF', 'CHF', 2), ('AUD', 'A$', 2), ('CAD', 'C$', 2)
on conflict (code) do nothing;

-- USD-anchored FX rates. 1 USD = rate_to_usd^-1 of the target currency.
-- Refreshed by /api/apptflow/cron/fx-sync.
create table if not exists apptflow.fx_rates (
  currency text primary key references apptflow.currencies(code) on delete cascade,
  usd_per_unit numeric(18,8) not null,  -- 1 unit of `currency` = this many USD
  source text not null default 'exchangerate.host',
  fetched_at timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- 1. Tenants (businesses using the product)
-- --------------------------------------------------------------------

create table if not exists apptflow.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,               -- Supabase auth user
  business_name text not null,
  vertical text not null default 'generic',  -- dental, salon, clinic, fitness, legal...
  country text,                              -- ISO-3166 alpha-2
  timezone text not null default 'UTC',
  default_locale text not null default 'en' references apptflow.locales(code),
  default_currency text not null default 'USD' references apptflow.currencies(code),
  whatsapp_phone_number_id text,             -- per-tenant WA number (if using BYO)
  status text not null default 'onboarding'
    check (status in ('onboarding', 'active', 'past_due', 'paused', 'churned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_apptflow_tenants_owner on apptflow.tenants(owner_user_id);

-- --------------------------------------------------------------------
-- 2. Google Calendar OAuth tokens (encrypted at app layer)
-- --------------------------------------------------------------------

create table if not exists apptflow.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references apptflow.tenants(id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  google_calendar_id text,                 -- the target calendar id (primary by default)
  google_account_email text,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scope text,
  sync_token text,                         -- incremental sync pointer
  webhook_channel_id text,
  webhook_resource_id text,
  webhook_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- 3. Customers & appointments
-- --------------------------------------------------------------------

create table if not exists apptflow.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  full_name text,
  phone_e164 text,                         -- canonical E.164 form
  email text,
  preferred_locale text references apptflow.locales(code),
  consent_marketing boolean not null default false,
  consent_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (tenant_id, phone_e164)
);

create index if not exists idx_apptflow_customers_tenant on apptflow.customers(tenant_id);

create table if not exists apptflow.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  price_amount numeric(12,2) not null default 0,
  price_currency text not null references apptflow.currencies(code),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists apptflow.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  customer_id uuid references apptflow.customers(id) on delete set null,
  service_id uuid references apptflow.services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  booking_channel text not null default 'bot'
    check (booking_channel in ('bot', 'manual', 'webform', 'api')),
  google_event_id text,
  reminder_sent_24h boolean not null default false,
  reminder_sent_2h boolean not null default false,
  confirmation_sent boolean not null default false,
  notes text,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_apptflow_appointments_tenant_time
  on apptflow.appointments(tenant_id, starts_at);
create index if not exists idx_apptflow_appointments_reminders
  on apptflow.appointments(tenant_id, status, starts_at)
  where status in ('scheduled', 'confirmed');

-- --------------------------------------------------------------------
-- 4. Conversations (WhatsApp threads with customers / leads)
-- --------------------------------------------------------------------

create table if not exists apptflow.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  customer_id uuid references apptflow.customers(id) on delete set null,
  wa_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'system')),
  message_text text,
  message_type text default 'text' check (message_type in ('text', 'template', 'interactive', 'media', 'system')),
  template_name text,
  intent text,
  confidence numeric(5,4),
  language text,
  created_at timestamptz not null default now()
);

create index if not exists idx_apptflow_conv_tenant_time
  on apptflow.conversations(tenant_id, created_at desc);

-- --------------------------------------------------------------------
-- 5. Subscriptions (Stripe-backed, multi-currency, margin-aware)
-- --------------------------------------------------------------------

create table if not exists apptflow.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- 'starter', 'growth', 'pro'
  name text not null,
  stripe_product_id text,
  included_appointments int not null default 100,
  included_whatsapp_msgs int not null default 1000,
  overage_price_appointment_usd numeric(12,4) not null default 0.25,
  overage_price_whatsapp_usd numeric(12,4) not null default 0.015,
  base_price_usd numeric(12,2) not null,
  min_margin numeric(5,4) not null default 0.10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into apptflow.pricing_plans (code, name, included_appointments, included_whatsapp_msgs, base_price_usd)
values
  ('starter', 'Starter', 100, 1000, 49.00),
  ('growth',  'Growth',  500, 5000, 149.00),
  ('pro',     'Pro',    2000, 20000, 399.00)
on conflict (code) do nothing;

-- Per-currency Stripe Price rows. Created lazily by the Stripe sync job.
create table if not exists apptflow.plan_prices (
  plan_id uuid not null references apptflow.pricing_plans(id) on delete cascade,
  currency text not null references apptflow.currencies(code),
  unit_amount_minor int not null,         -- in smallest unit (cents)
  stripe_price_id text,
  updated_at timestamptz not null default now(),
  primary key (plan_id, currency)
);

create table if not exists apptflow.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references apptflow.tenants(id) on delete cascade,
  plan_id uuid not null references apptflow.pricing_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  billing_currency text not null references apptflow.currencies(code),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at timestamptz,
  failed_payment_count int not null default 0,
  last_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usage & invoice items tracked for margin enforcement.
create table if not exists apptflow.usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  kind text not null check (kind in (
    'appointment.created', 'whatsapp.outbound', 'whatsapp.inbound',
    'calendar.sync', 'campaign.touch', 'llm.call'
  )),
  quantity numeric(12,4) not null default 1,
  unit_cost_usd numeric(12,6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_apptflow_usage_tenant_time
  on apptflow.usage_events(tenant_id, occurred_at desc);

-- Monthly cost ledger: one row per tenant per month per cost category.
create table if not exists apptflow.cost_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  period_month date not null,                        -- first day of month
  category text not null check (category in (
    'whatsapp', 'stripe_fees', 'infra', 'llm', 'ads', 'other'
  )),
  cost_usd numeric(14,4) not null default 0,
  source text,
  created_at timestamptz not null default now(),
  unique (tenant_id, period_month, category)
);

-- Per-tenant per-month revenue/cost/margin snapshot, recomputed by cron.
create table if not exists apptflow.margin_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  period_month date not null,
  revenue_usd numeric(14,4) not null default 0,
  cost_usd numeric(14,4) not null default 0,
  margin numeric(8,6) not null default 0,            -- (revenue - cost)/revenue
  min_required_margin numeric(5,4) not null default 0.10,
  required_price_usd numeric(14,4) not null default 0,
  under_margin boolean not null default false,
  recomputed_at timestamptz not null default now(),
  unique (tenant_id, period_month)
);

-- --------------------------------------------------------------------
-- 6. Leads & campaigns (self-serve acquisition)
-- --------------------------------------------------------------------

create table if not exists apptflow.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references apptflow.tenants(id) on delete cascade,   -- null = platform-wide lead
  source text not null,                        -- 'landing', 'referral', 'whatsapp', 'import'
  full_name text,
  email text,
  phone_e164 text,
  locale text references apptflow.locales(code),
  country text,
  vertical text,
  score int not null default 0 check (score between 0 and 100),
  stage text not null default 'new'
    check (stage in ('new', 'engaged', 'qualified', 'converted', 'lost')),
  consent_marketing boolean not null default false,
  utm jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_apptflow_leads_tenant_stage
  on apptflow.leads(tenant_id, stage, score desc);

create table if not exists apptflow.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references apptflow.tenants(id) on delete cascade,   -- null = platform campaign
  name text not null,
  goal text not null check (goal in ('acquisition', 'reactivation', 'upsell', 'retention')),
  channel text not null check (channel in ('whatsapp', 'email', 'landing', 'referral')),
  locale text references apptflow.locales(code),
  audience_query jsonb not null default '{}'::jsonb,
  template_name text,
  message_body text,
  budget_usd numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'running', 'paused', 'completed')),
  scheduled_at timestamptz,
  last_run_at timestamptz,
  stats jsonb not null default '{"sent":0,"delivered":0,"replied":0,"converted":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- 7. Autonomous agent runs
-- --------------------------------------------------------------------

create table if not exists apptflow.agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references apptflow.tenants(id) on delete cascade,   -- null = platform-level
  agent_name text not null check (agent_name in (
    'growth', 'qualification', 'conversion', 'onboarding', 'messaging',
    'scheduling', 'reminders', 'retention', 'billing', 'pricing', 'compliance'
  )),
  trigger_type text not null check (trigger_type in ('event', 'schedule', 'webhook', 'manual')),
  status text not null check (status in ('started', 'completed', 'failed', 'cancelled')),
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_apptflow_agent_runs_time
  on apptflow.agent_runs(agent_name, started_at desc);

-- --------------------------------------------------------------------
-- 8. Daily KPI rollups
-- --------------------------------------------------------------------

create table if not exists apptflow.kpi_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  kpi_date date not null,
  leads_total int not null default 0,
  appointments_booked int not null default 0,
  appointments_completed int not null default 0,
  appointments_cancelled int not null default 0,
  no_show_total int not null default 0,
  whatsapp_outbound int not null default 0,
  whatsapp_inbound int not null default 0,
  revenue_usd numeric(14,4) not null default 0,
  cost_usd numeric(14,4) not null default 0,
  unique (tenant_id, kpi_date)
);

-- --------------------------------------------------------------------
-- 9. Updated-at trigger
-- --------------------------------------------------------------------

create or replace function apptflow.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'tenants','calendar_connections','customers','appointments',
      'subscriptions','leads','campaigns'
    ])
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on apptflow.%1$s;
       create trigger trg_%1$s_updated_at before update on apptflow.%1$s
         for each row execute function apptflow.set_updated_at();', t);
  end loop;
end $$;

-- --------------------------------------------------------------------
-- 10. Row-Level Security
-- --------------------------------------------------------------------

alter table apptflow.tenants               enable row level security;
alter table apptflow.calendar_connections  enable row level security;
alter table apptflow.customers             enable row level security;
alter table apptflow.services              enable row level security;
alter table apptflow.appointments          enable row level security;
alter table apptflow.conversations         enable row level security;
alter table apptflow.subscriptions         enable row level security;
alter table apptflow.usage_events          enable row level security;
alter table apptflow.cost_ledger           enable row level security;
alter table apptflow.margin_snapshots      enable row level security;
alter table apptflow.leads                 enable row level security;
alter table apptflow.campaigns             enable row level security;
alter table apptflow.agent_runs            enable row level security;
alter table apptflow.kpi_daily             enable row level security;

-- Helper predicate: current auth user owns the tenant.
create or replace function apptflow.current_user_owns_tenant(p_tenant_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from apptflow.tenants t
    where t.id = p_tenant_id and t.owner_user_id = auth.uid()
  );
$$;

-- Owner-full-access policy for all tenant-scoped tables.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'calendar_connections','customers','services','appointments',
      'conversations','subscriptions','usage_events','cost_ledger',
      'margin_snapshots','leads','campaigns','kpi_daily'
    ])
  loop
    execute format(
      'drop policy if exists "tenant owner all" on apptflow.%1$s;
       create policy "tenant owner all" on apptflow.%1$s
         for all to authenticated
         using (apptflow.current_user_owns_tenant(tenant_id))
         with check (apptflow.current_user_owns_tenant(tenant_id));', t);
  end loop;
end $$;

drop policy if exists "owner all tenants" on apptflow.tenants;
create policy "owner all tenants" on apptflow.tenants
  for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- agent_runs may be platform-wide (tenant_id null); allow owner read of own rows.
drop policy if exists "owner read agent runs" on apptflow.agent_runs;
create policy "owner read agent runs" on apptflow.agent_runs
  for select to authenticated
  using (
    tenant_id is null
    or apptflow.current_user_owns_tenant(tenant_id)
  );

-- Lookup tables: readable to everyone (including anon).
grant usage on schema apptflow to anon, authenticated;
grant select on apptflow.locales, apptflow.currencies, apptflow.fx_rates,
  apptflow.pricing_plans, apptflow.plan_prices to anon, authenticated;


-- ============================================================================
-- MIGRATION: 20260417130000_apptflow_service_role_grants.sql
-- ============================================================================
-- Grants for service_role (used by cron endpoints and webhooks via service-role client)
-- service_role bypasses RLS but still needs USAGE on the schema and table-level
-- privileges to read/write. Also ensure anon/authenticated can see lookup data
-- and that future tables inherit appropriate grants.

grant usage on schema apptflow to service_role;

grant all privileges on all tables in schema apptflow to service_role;
grant all privileges on all sequences in schema apptflow to service_role;
grant all privileges on all functions in schema apptflow to service_role;

-- Make sure any new objects created later automatically inherit the same grants.
alter default privileges in schema apptflow
  grant all on tables to service_role;
alter default privileges in schema apptflow
  grant all on sequences to service_role;
alter default privileges in schema apptflow
  grant all on functions to service_role;


-- ============================================================================
-- MIGRATION: 20260418100000_apptflow_lemon_squeezy.sql
-- ============================================================================
-- AppointFlow: switch billing from Stripe to Lemon Squeezy (Merchant of Record)
--
-- Lemon Squeezy acts as the merchant and handles VAT/GST remittance in 140+
-- countries, so AppointFlow only needs to track the external subscription
-- identifier + the customer id (for portal/cancel deep-links).
--
-- We keep the existing stripe_* columns for a deprecation window. They can
-- be dropped once no subscription references them (planned: +90 days).

alter table apptflow.subscriptions
  add column if not exists lemon_subscription_id text unique,
  add column if not exists lemon_customer_id     text,
  add column if not exists lemon_variant_id      text,
  add column if not exists lemon_order_id        text;

create index if not exists subscriptions_lemon_customer_idx
  on apptflow.subscriptions (lemon_customer_id);

-- Same on pricing_plans (for dashboard admin workflows that want a direct
-- Lemon product id).
alter table apptflow.pricing_plans
  add column if not exists lemon_product_id text;

alter table apptflow.plan_prices
  add column if not exists lemon_variant_id text;

COMMIT;
-- ============================================================================
-- BİTTİ. Şimdi terminale dön ve 'migration repair' komutlarını çalıştır.
-- ============================================================================
