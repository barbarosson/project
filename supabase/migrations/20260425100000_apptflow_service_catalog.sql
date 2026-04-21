-- ====================================================================
-- AppointFlow — service catalog + availability windows
-- Lets tenants define multiple services (haircut, beard, combo, cleaning,
-- consultation, therapy session...) with their own duration, price and
-- weekly availability windows, plus tenant-wide business hours.
-- ====================================================================

-- 1) Extend apptflow.services with catalog metadata.
alter table apptflow.services
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists sort_order int not null default 0,
  add column if not exists buffer_minutes int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_apptflow_services_tenant_active
  on apptflow.services(tenant_id, is_active, sort_order);

-- 2) Per-service weekly availability. When no rows exist for a service,
-- the tenant's business_hours (below) are used; when that is also empty
-- a conservative 09:00–18:00 Mon–Sat default applies.
create table if not exists apptflow.service_availability_windows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  service_id uuid not null references apptflow.services(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_apptflow_service_windows_service
  on apptflow.service_availability_windows(service_id, weekday)
  where is_active;

-- 3) Tenant-level business hours (fallback when a service has no windows).
create table if not exists apptflow.business_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references apptflow.tenants(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, weekday, start_time, end_time),
  check (end_time > start_time)
);

create index if not exists idx_apptflow_business_hours_tenant
  on apptflow.business_hours(tenant_id, weekday)
  where is_active;

-- 4) RLS for the two new tables.
alter table apptflow.service_availability_windows enable row level security;
alter table apptflow.business_hours              enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array['service_availability_windows', 'business_hours'])
  loop
    execute format(
      'drop policy if exists "tenant owner all" on apptflow.%1$s;
       create policy "tenant owner all" on apptflow.%1$s
         for all to authenticated
         using (apptflow.current_user_owns_tenant(tenant_id))
         with check (apptflow.current_user_owns_tenant(tenant_id));', t);
  end loop;
end $$;

-- 5) Keep services.updated_at fresh.
create or replace function apptflow.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_apptflow_services_touch on apptflow.services;
create trigger trg_apptflow_services_touch
  before update on apptflow.services
  for each row execute function apptflow.touch_updated_at();
