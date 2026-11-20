-- Disposable PostgreSQL/Supabase verification for correction 002.
-- Run only after both migrations on a disposable test database.
-- Required psql variables: user_a, user_b, conversation_a, request_a,
-- request_b, ledger_id, model_price_version_id. The fixture must provide two
-- profiles, one conversation owned by user_a, two accounting requests owned by
-- A/B, and one existing ledger row identified by ledger_id.
\set ON_ERROR_STOP on
\echo 'Correction 002 runtime verification begins; use a disposable database only.'

begin;

-- Cross-account composite-FK rejection.
do $$
begin
  begin
    insert into public.inference_requests
      (profile_id, conversation_id, model_price_version_id, accounting_request_id)
    values
      (:'user_b'::uuid, :'conversation_a'::uuid, :'model_price_version_id'::uuid, :'request_b'::uuid);
    raise exception 'FAIL: cross-account conversation reference was accepted';
  exception when foreign_key_violation then
    raise notice 'PASS: cross-account conversation reference rejected';
  end;
end $$;

do $$
begin
  begin
    insert into public.reservation_holds
      (profile_id, accounting_request_id, reserved_units, expires_at)
    values
      (:'user_b'::uuid, :'request_a'::uuid, 1, now() + interval '1 hour');
    raise exception 'FAIL: cross-account hold reference was accepted';
  exception when foreign_key_violation then
    raise notice 'PASS: cross-account hold reference rejected';
  end;
end $$;

do $$
begin
  begin
    insert into public.token_ledger
      (profile_id, accounting_request_id, entry_type, amount_units, operation_id)
    values
      (:'user_b'::uuid, :'request_a'::uuid, 'usage_debit', -1, 'test-cross-account-ledger');
    raise exception 'FAIL: cross-account ledger reference was accepted';
  exception when foreign_key_violation then
    raise notice 'PASS: cross-account ledger reference rejected';
  end;
end $$;

-- Refund without an accounting request is rejected by the source constraint.
do $$
begin
  begin
    insert into public.token_ledger
      (profile_id, entry_type, amount_units, operation_id, reason)
    values (:'user_a'::uuid, 'refund', 1, 'test-refund-without-request', 'test');
    raise exception 'FAIL: refund without accounting request was accepted';
  exception when check_violation then
    raise notice 'PASS: refund without accounting request rejected';
  end;
end $$;

-- Append-only policy must reject an actual ledger-row mutation.
do $$
declare
  v_rejected boolean := false;
begin
  begin
    update public.token_ledger set reason = 'tampered' where id = :'ledger_id'::uuid;
  exception when raise_exception then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: ledger update path was not rejected'; end if;
  raise notice 'PASS: ledger update trigger is installed';
end $$;

-- The redacted view exposes no metadata/provider/accounting columns.
do $$
declare
  v_has_sensitive boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallet_ledger_public'
      and column_name in ('metadata', 'provider_event_id', 'accounting_request_id')
  ) into v_has_sensitive;
  if v_has_sensitive then raise exception 'FAIL: sensitive ledger column exposed'; end if;
  raise notice 'PASS: public ledger view is redacted';
end $$;

-- Raw-table denial and redacted-view grant are privilege checks, not RLS substitutes.
do $$
begin
  if has_table_privilege('authenticated', 'public.token_ledger', 'SELECT') then
    raise exception 'FAIL: authenticated role retains raw ledger SELECT';
  end if;
  if not has_table_privilege('authenticated', 'public.wallet_ledger_public', 'SELECT') then
    raise exception 'FAIL: authenticated role lacks redacted ledger view SELECT';
  end if;
  raise notice 'PASS: raw ledger denied and redacted view granted';
end $$;

rollback;
\echo 'Correction 002 runtime verification completed.'
\echo 'Concurrent refund/reservation, duplicate settlement, two-user RLS, and projection rebuild checks require separate sessions and are documented in docs/database/implementation-draft.md.'
