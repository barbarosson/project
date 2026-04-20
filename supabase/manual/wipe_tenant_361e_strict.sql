/*
  Strict wipe for tenant 361e6d16-13da-4aaf-b6ac-eda4451cf7b6

  Why this exists:
  - Some tables reference customers by customer_id/supplier_id and may NOT have tenant_id
  - Deleting customers first can fail with FK constraints (e.g. proposals_customer_id_fkey)

  What this script does:
  - Deletes dependent rows that reference customers of the tenant (even if the table has no tenant_id)
  - Then deletes tenant-scoped rows from tenant_id tables
  - Finally deletes customers of that tenant

  Safety:
  - v_confirm must be set to true
*/

do $$
declare
  v_tenant text := '361e6d16-13da-4aaf-b6ac-eda4451cf7b6';
  v_confirm boolean := false; -- set TRUE to actually delete
  v_customer_ids uuid[];
begin
  if not v_confirm then
    raise exception 'Safety stop: set v_confirm := true to wipe tenant %', v_tenant;
  end if;

  -- Collect customer ids for this tenant (tenant_id may be uuid or text)
  select array_agg(c.id)
  into v_customer_ids
  from public.customers c
  where c.tenant_id::text = v_tenant;

  if v_customer_ids is null or array_length(v_customer_ids, 1) is null then
    raise notice 'No customers found for tenant %, continuing with tenant_id tables wipe.', v_tenant;
  else
    -- PROPOSALS (+ line items)
    delete from public.proposal_line_items pli
    where pli.proposal_id in (
      select p.id from public.proposals p where p.customer_id = any(v_customer_ids)
    );
    delete from public.proposals p where p.customer_id = any(v_customer_ids);

    -- INVOICES (+ line items)
    delete from public.invoice_line_items ili
    where ili.invoice_id in (
      select i.id from public.invoices i where i.customer_id = any(v_customer_ids)
    );
    delete from public.invoices i where i.customer_id = any(v_customer_ids);

    -- ORDERS (+ items)
    delete from public.order_items oi
    where oi.order_id in (
      select o.id from public.orders o where o.customer_id = any(v_customer_ids)
    );
    delete from public.orders o where o.customer_id = any(v_customer_ids);

    -- PURCHASE INVOICES (+ line items) where supplier is a customer record
    delete from public.purchase_invoice_line_items pili
    where pili.purchase_invoice_id in (
      select pi.id from public.purchase_invoices pi where pi.supplier_id = any(v_customer_ids)
    );
    delete from public.purchase_invoices pi where pi.supplier_id = any(v_customer_ids);

    -- TRANSACTIONS
    delete from public.transactions tr where tr.customer_id = any(v_customer_ids);

    -- EXPENSES (if your schema uses customer_id on expenses)
    delete from public.expenses e where e.customer_id = any(v_customer_ids);
  end if;

  /*
    Wipe remaining tenant-scoped tables (tenant_id column) excluding customers/profiles/tenants.
    This removes logs/settings/etc for this tenant.
  */
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'tenant_id'
      and t.table_type = 'BASE TABLE'
      and c.table_name not in ('profiles', 'tenants', 'customers')
    group by c.table_name
    order by c.table_name
  loop
    execute format('delete from public.%I where tenant_id::text = $1', r.table_name) using v_tenant;
  end loop;

  -- Finally delete customers for the tenant
  delete from public.customers c where c.tenant_id::text = v_tenant;

  raise notice 'Strict wipe complete for tenant %', v_tenant;
end $$;

