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
