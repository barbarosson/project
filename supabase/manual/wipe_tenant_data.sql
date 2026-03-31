/*
  Wipe tenant-scoped application data (public schema) for a single tenant.

  Scope:
  - Deletes rows from ALL tables in schema "public" that have a column named "tenant_id"
  - Filters deletes by tenant_id = <target tenant uuid>
  - Does NOT touch auth.users
  - Does NOT delete from public.tenants / public.profiles by default (even if they have tenant_id)

  How to use:
  1) Run the PREVIEW block to see what would be deleted.
  2) In the APPLY block, set v_confirm := true and run it.
*/

-- =========================
-- CONFIG
-- =========================
-- Target tenant to wipe:
-- (starter@modulustech.appp)
-- tenant_id = 361e6d16-13da-4aaf-b6ac-eda4451cf7b6

-- =========================
-- PREVIEW
-- =========================
do $$
declare
  v_tenant uuid := '361e6d16-13da-4aaf-b6ac-eda4451cf7b6';
  r record;
  v_count bigint;
begin
  raise notice 'Preview for tenant_id=%', v_tenant;

  for r in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'tenant_id'
      and c.table_name not in ('profiles', 'tenants')
    group by c.table_name
    order by c.table_name
  loop
    execute format('select count(*) from public.%I where tenant_id = $1', r.table_name)
      into v_count
      using v_tenant;

    if v_count > 0 then
      raise notice 'Would delete % rows from public.%', v_count, r.table_name;
    end if;
  end loop;
end $$;


-- =========================
-- APPLY (DELETES DATA)
-- =========================
do $$
declare
  v_tenant uuid := '361e6d16-13da-4aaf-b6ac-eda4451cf7b6';
  v_confirm boolean := false; -- <-- set TRUE to actually delete
  r record;
  v_deleted bigint;
begin
  if not v_confirm then
    raise exception 'Safety stop: set v_confirm := true to wipe tenant %', v_tenant;
  end if;

  raise notice 'Wiping tenant_id=%', v_tenant;

  -- Delete from child tables first where possible.
  -- We attempt multiple passes to reduce FK-order sensitivity.
  for i in 1..5 loop
    for r in
      select c.table_name
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.column_name = 'tenant_id'
        and c.table_name not in ('profiles', 'tenants')
      group by c.table_name
      order by c.table_name
    loop
      begin
        execute format('delete from public.%I where tenant_id = $1', r.table_name)
          using v_tenant;
        get diagnostics v_deleted = row_count;
        if v_deleted > 0 then
          raise notice 'Deleted % rows from public.%', v_deleted, r.table_name;
        end if;
      exception
        when foreign_key_violation then
          -- ignore in early passes; next passes may succeed after children are cleared
          null;
      end;
    end loop;
  end loop;

  raise notice 'Done. Re-run PREVIEW to confirm all counts are 0.';
end $$;

