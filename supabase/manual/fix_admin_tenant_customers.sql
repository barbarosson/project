/*
  Fix: admin@modulus.com tenant_id mismatch for Cari (customers) list

  Problem pattern:
  - UI filters: customers.tenant_id = TenantContext.tenantId
  - Some create flows previously wrote: customers.tenant_id = auth.uid() (user id)
  => For admin@modulus.com (and any user), rows can end up under the wrong tenant_id.

  What this script does:
  - Finds admin user's auth uid by email
  - Determines the "real" tenant id:
      1) profiles.tenant_id (preferred)
      2) tenants.id where tenants.owner_id = admin uid (fallback)
  - Moves customers rows where tenant_id == admin uid to the real tenant id

  Safe workflow:
  - Run the PREVIEW section first
  - Then run the APPLY section (transactional)
*/

-- =========================
-- PREVIEW (no changes)
-- =========================
with admin_user as (
  select id as admin_uid, email
  from auth.users
  where lower(email) = 'admin@modulus.com'
  limit 1
),
target as (
  select
    au.admin_uid,
    au.email,
    coalesce(
      (select p.tenant_id from public.profiles p where p.id = au.admin_uid limit 1),
      (select t.id from public.tenants t where t.owner_id = au.admin_uid order by t.created_at asc nulls last limit 1)
    ) as target_tenant_id
  from admin_user au
)
select
  t.admin_uid,
  t.email,
  t.target_tenant_id,
  (select count(*) from public.customers c where c.tenant_id = t.admin_uid) as customers_with_wrong_tenant_id,
  (select count(*) from public.customers c where c.tenant_id = t.target_tenant_id) as customers_already_on_target_tenant
from target t;

-- Optional: sample rows that will be moved
with admin_user as (
  select id as admin_uid
  from auth.users
  where lower(email) = 'admin@modulus.com'
  limit 1
)
select c.id, c.company_title, c.name, c.tax_number, c.created_at, c.tenant_id
from public.customers c
where c.tenant_id = (select admin_uid from admin_user)
order by c.created_at desc
limit 50;


-- =========================
-- APPLY (makes changes)
-- =========================
do $$
declare
  v_admin_uid uuid;
  v_target_tenant_id uuid;
  v_moved int := 0;
begin
  select u.id into v_admin_uid
  from auth.users u
  where lower(u.email) = 'admin@modulus.com'
  limit 1;

  if v_admin_uid is null then
    raise exception 'admin@modulus.com not found in auth.users';
  end if;

  select coalesce(
      (select p.tenant_id from public.profiles p where p.id = v_admin_uid limit 1),
      (select t.id from public.tenants t where t.owner_id = v_admin_uid order by t.created_at asc nulls last limit 1)
    )
    into v_target_tenant_id;

  if v_target_tenant_id is null then
    raise exception 'Target tenant id could not be resolved for admin uid %, check profiles.tenant_id or tenants.owner_id', v_admin_uid;
  end if;

  -- Move customers written under tenant_id = admin uid to the resolved tenant id
  update public.customers
  set tenant_id = v_target_tenant_id
  where tenant_id = v_admin_uid;

  get diagnostics v_moved = row_count;

  raise notice 'Moved % customers rows from tenant_id=% to tenant_id=%', v_moved, v_admin_uid, v_target_tenant_id;
end $$;

-- =========================
-- POST-CHECK
-- =========================
with admin_user as (
  select id as admin_uid, email
  from auth.users
  where lower(email) = 'admin@modulus.com'
  limit 1
),
target as (
  select
    au.admin_uid,
    au.email,
    coalesce(
      (select p.tenant_id from public.profiles p where p.id = au.admin_uid limit 1),
      (select t.id from public.tenants t where t.owner_id = au.admin_uid order by t.created_at asc nulls last limit 1)
    ) as target_tenant_id
  from admin_user au
)
select
  t.admin_uid,
  t.email,
  t.target_tenant_id,
  (select count(*) from public.customers c where c.tenant_id = t.admin_uid) as customers_still_on_admin_uid,
  (select count(*) from public.customers c where c.tenant_id = t.target_tenant_id) as customers_on_target_tenant
from target t;

