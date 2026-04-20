-- Add a jsonb metadata column to conversations so the bot can carry
-- lightweight per-turn state between inbound messages (e.g. slot
-- candidates offered by the previous outbound, service_id locked in
-- during a booking flow, reschedule target appointment id).
--
-- Why jsonb on the log table instead of a side table:
--   * State lives and dies with the message that produced it.
--   * Replaying a conversation = replaying the JSON fields.
--   * No extra joins when the reply engine fetches "last outbound".

alter table apptflow.conversations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- GIN index to quickly find the last outbound carrying a given
-- pending_action (e.g. 'slot_choice') for a customer.
create index if not exists idx_apptflow_conv_metadata_gin
  on apptflow.conversations using gin (metadata jsonb_path_ops);
