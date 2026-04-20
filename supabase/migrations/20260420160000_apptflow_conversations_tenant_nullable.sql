-- Allow conversations to store inbound messages that arrive before a tenant
-- has been provisioned for a given WhatsApp phone_number_id.
--
-- Why:
-- - The WhatsApp webhook receives inbound messages for ANY phone_number_id
--   Meta routes to our callback URL (including Meta's own test webhook
--   button and dev test numbers).
-- - We still want an audit trail of these pre-tenant messages for debugging
--   and retrospective tenant attribution, not to drop them silently.
-- - RLS already gates "authenticated" reads to tenant owners; a null tenant
--   row simply isn't visible through the API, only to service_role.

alter table apptflow.conversations
  alter column tenant_id drop not null;

-- Helpful partial index for triaging unattributed inbound messages.
create index if not exists idx_apptflow_conv_unattributed
  on apptflow.conversations (created_at desc)
  where tenant_id is null;
