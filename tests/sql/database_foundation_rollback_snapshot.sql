-- Run after the foundation migration and before correction 002 on disposable PostgreSQL.
create table public._task003_rollback_snapshot as
select
  pg_get_functiondef('public.assert_refund_within_debit()'::regprocedure) as refund_function,
  has_table_privilege('service_role', 'public.token_ledger', 'INSERT') as service_can_insert_ledger,
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE') as auth_can_update_display_name,
  has_column_privilege('authenticated', 'public.token_ledger', 'id', 'SELECT') as auth_can_read_safe_ledger_columns,
  (select string_agg(c.conname || ':' || pg_get_constraintdef(c.oid), E'\n' order by c.conname)
     from pg_constraint c where c.conrelid in (
       'public.inference_requests'::regclass, 'public.reservation_holds'::regclass,
       'public.token_ledger'::regclass) and c.contype = 'f') as ownership_foreign_keys,
  (select string_agg(p.schemaname || '.' || p.tablename || ':' || p.policyname || ':' || p.cmd || ':' ||
       coalesce(p.qual, '') || ':' || coalesce(p.with_check, ''), E'\n' order by p.schemaname, p.tablename, p.policyname)
     from pg_policies p where p.schemaname = 'public') as policies;
