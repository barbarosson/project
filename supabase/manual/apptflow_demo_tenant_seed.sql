-- ============================================================================
-- Modulus AppointFlow — Demo Tenant Seed
--
-- This file does TWO things in one transaction:
--
--   1) Applies the latest two pending migrations (conversations.tenant_id
--      becoming nullable + conversations.metadata jsonb). If you already
--      applied 20260420160000 earlier, the ALTER will be a no-op.
--
--   2) Creates (or refreshes) a demo tenant bound to your Meta test
--      WhatsApp phone number, with one sample service. After you RUN this,
--      inbound messages from your phone to the Meta test number will be
--      attributed to this tenant and the bot will reply automatically.
--
-- BEFORE RUNNING: replace the two placeholders in STEP 2 below.
--
--   PLACEHOLDER_OWNER_EMAIL     → the email you use to log into modulusaas.com
--   PLACEHOLDER_WA_PHONE_ID     → value of your WHATSAPP_PHONE_NUMBER_ID
--                                  env var (Netlify → Environment variables)
--
-- Paste this whole file into:
--   https://supabase.com/dashboard/project/itvrvouaxcutpetyzhvg/sql/new
-- Then click RUN.  You should see a NOTICE line with the tenant id.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- STEP 1 — migrations
-- ---------------------------------------------------------------------------

alter table apptflow.conversations
  alter column tenant_id drop not null;

create index if not exists idx_apptflow_conv_unattributed
  on apptflow.conversations (created_at desc)
  where tenant_id is null;

alter table apptflow.conversations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_apptflow_conv_metadata_gin
  on apptflow.conversations using gin (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- STEP 2 — demo tenant + service   ⚠️  EDIT THE TWO PLACEHOLDERS BELOW  ⚠️
-- ---------------------------------------------------------------------------

do $$
declare
  -- vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
  v_owner_email        text := 'PLACEHOLDER_OWNER_EMAIL';
  v_wa_phone_number_id text := 'PLACEHOLDER_WA_PHONE_ID';
  -- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  v_business_name      text := 'Bella Hair Salon (Demo)';
  v_vertical           text := 'beauty';
  v_country            text := 'TR';
  v_timezone           text := 'Europe/Istanbul';
  v_default_locale     text := 'en';
  v_default_currency   text := 'USD';

  v_service_name       text := 'Demo Haircut';
  v_service_minutes    int  := 30;
  v_service_price      numeric(12,2) := 25.00;

  v_owner_id   uuid;
  v_tenant_id  uuid;
  v_service_id uuid;
  v_currency_exists boolean;
  v_locale_exists   boolean;
begin
  if v_owner_email = 'PLACEHOLDER_OWNER_EMAIL' then
    raise exception 'Edit v_owner_email first (your modulusaas.com login email).';
  end if;
  if v_wa_phone_number_id = 'PLACEHOLDER_WA_PHONE_ID' then
    raise exception 'Edit v_wa_phone_number_id first (WHATSAPP_PHONE_NUMBER_ID env var).';
  end if;

  -- Resolve owner user from auth.users.
  select id into v_owner_id
    from auth.users
    where email = v_owner_email
    limit 1;
  if v_owner_id is null then
    raise exception 'No auth.users row with email=% — did you sign up on modulusaas.com with a different address?', v_owner_email;
  end if;

  -- Guard: currency + locale rows must exist in lookup tables.
  select exists(select 1 from apptflow.currencies where code = v_default_currency)
    into v_currency_exists;
  if not v_currency_exists then
    insert into apptflow.currencies (code, name) values (v_default_currency, v_default_currency);
  end if;
  select exists(select 1 from apptflow.locales where code = v_default_locale)
    into v_locale_exists;
  if not v_locale_exists then
    insert into apptflow.locales (code, name) values (v_default_locale, v_default_locale);
  end if;

  -- Upsert tenant (whatsapp_phone_number_id isn't unique so we do it manually).
  select id into v_tenant_id
    from apptflow.tenants
    where whatsapp_phone_number_id = v_wa_phone_number_id
    limit 1;

  if v_tenant_id is null then
    insert into apptflow.tenants (
      owner_user_id, business_name, vertical, country, timezone,
      default_locale, default_currency, whatsapp_phone_number_id, status
    ) values (
      v_owner_id, v_business_name, v_vertical, v_country, v_timezone,
      v_default_locale, v_default_currency, v_wa_phone_number_id, 'active'
    )
    returning id into v_tenant_id;
  else
    update apptflow.tenants
      set owner_user_id = v_owner_id,
          business_name = v_business_name,
          status        = 'active',
          timezone      = v_timezone
    where id = v_tenant_id;
  end if;

  -- Upsert a single demo service.
  select id into v_service_id
    from apptflow.services
    where tenant_id = v_tenant_id and name = v_service_name
    limit 1;

  if v_service_id is null then
    insert into apptflow.services (
      tenant_id, name, duration_minutes, price_amount, price_currency, is_active
    ) values (
      v_tenant_id, v_service_name, v_service_minutes,
      v_service_price, v_default_currency, true
    )
    returning id into v_service_id;
  end if;

  raise notice '===== AppointFlow demo seed OK =====';
  raise notice 'Tenant id : %', v_tenant_id;
  raise notice 'Service id: %', v_service_id;
  raise notice 'Send a WhatsApp message with the word "book" to your Meta test';
  raise notice 'number from the phone you use for testing. The bot should reply';
  raise notice 'within a few seconds with up to 3 open slot proposals.';
end $$;

commit;
