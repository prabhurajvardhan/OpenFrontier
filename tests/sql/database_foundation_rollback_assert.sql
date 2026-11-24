\set ON_ERROR_STOP on
do $$
declare v_expected record; v_actual_function text; v_actual_fks text; v_actual_policies text; v_actual_truncate_privileges text;
begin
  select * into v_expected from public._task003_rollback_snapshot;
  select pg_get_functiondef('public.assert_refund_within_debit()'::regprocedure) into v_actual_function;
  select string_agg(t.name || ':' || has_table_privilege('service_role', format('public.%I', t.name), 'TRUNCATE')::text, E'\n' order by t.name)
    into v_actual_truncate_privileges
    from unnest(array['profiles','wallet_accounts','accounting_requests','inference_requests','reservation_holds',
      'token_ledger','provider_usage_records','overage_reconciliations','model_price_versions']) as t(name);
  select string_agg(c.conname || ':' || pg_get_constraintdef(c.oid), E'\n' order by c.conname)
    into v_actual_fks from pg_constraint c where c.conrelid in (
      'public.inference_requests'::regclass, 'public.reservation_holds'::regclass,
      'public.token_ledger'::regclass) and c.contype = 'f';
  select string_agg(p.schemaname || '.' || p.tablename || ':' || p.policyname || ':' || p.cmd || ':' ||
       coalesce(p.qual, '') || ':' || coalesce(p.with_check, ''), E'\n' order by p.schemaname, p.tablename, p.policyname)
    into v_actual_policies from pg_policies p where p.schemaname = 'public';
  if v_actual_function is distinct from v_expected.refund_function then raise exception 'FAIL: refund function rollback differs'; end if;
  if has_table_privilege('service_role', 'public.token_ledger', 'INSERT') is distinct from v_expected.service_can_insert_ledger then
    raise exception 'FAIL: service-role ledger INSERT privilege rollback differs';
  end if;
  if v_actual_truncate_privileges is distinct from v_expected.service_role_truncate_privileges then
    raise exception 'FAIL: service-role TRUNCATE privilege rollback differs';
  end if;
  if has_column_privilege('authenticated', 'public.token_ledger', 'id', 'SELECT') is distinct from v_expected.auth_can_read_safe_ledger_columns then
    raise exception 'FAIL: safe ledger column grant rollback differs';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE') is distinct from v_expected.auth_can_update_display_name then
    raise exception 'FAIL: profile display-name update grant rollback differs';
  end if;
  if v_actual_fks is distinct from v_expected.ownership_foreign_keys then raise exception 'FAIL: ownership FK rollback differs'; end if;
  if v_actual_policies is distinct from v_expected.policies then raise exception 'FAIL: RLS policy rollback differs'; end if;
end $$;
drop table public._task003_rollback_snapshot;
\echo 'PASS: correction rollback restored function, permissions, foreign keys, and RLS policies.'
