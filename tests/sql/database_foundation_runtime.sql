-- Runtime assertions for a disposable local PostgreSQL database only.
-- The fixture profiles and balances below are synthetic and never leave this database.
\set ON_ERROR_STOP on

select set_config('request.jwt.claims', '{"role":"service_role"}', false);
select public.provision_firebase_profile('task003-fixture-firebase-uid-a') as profile_a \gset
select public.provision_firebase_profile('task003-fixture-firebase-uid-b') as profile_b \gset
select set_config('task.profile_a', :'profile_a', false);
select set_config('task.profile_b', :'profile_b', false);

insert into public.model_catalogue (model_key, provider_namespace, display_name, status)
values ('task003-disposable-model', 'test-only', 'Disposable Test Model', 'active')
returning id as test_model_id \gset
insert into public.model_price_versions
  (model_id, version, provider_uncached_input_cost_per_million,
   provider_cached_input_cost_per_million, provider_cache_write_cost_per_million,
   provider_output_cost_per_million, provider_cost_currency, effective_from, source)
values (:'test_model_id'::uuid, 1, 100, 200, 300, 400, 'TEST', now() - interval '1 day', 'disposable test fixture')
returning id as test_price_id \gset
select set_config('task.model_id', :'test_model_id', false);
select set_config('task.price_id', :'test_price_id', false);

insert into public.conversations (profile_id, title)
values (:'profile_a'::uuid, 'Disposable A') returning id as conversation_a \gset
insert into public.conversations (profile_id, title)
values (:'profile_b'::uuid, 'Disposable B') returning id as conversation_b \gset
select set_config('task.conversation_a', :'conversation_a', false);
select set_config('task.conversation_b', :'conversation_b', false);

-- Synthetic local opening balances are test fixtures, not promotional or real user credits.
insert into public.token_ledger (profile_id, entry_type, amount_units, operation_id, reason)
values (:'profile_a'::uuid, 'admin_adjustment', 1000, 'task003-fixture-opening-a', 'disposable test fixture only');
insert into public.token_ledger (profile_id, entry_type, amount_units, operation_id, reason)
values (:'profile_b'::uuid, 'admin_adjustment', 1000, 'task003-fixture-opening-b', 'disposable test fixture only');
select public.refresh_wallet_projection(:'profile_a'::uuid);
select public.refresh_wallet_projection(:'profile_b'::uuid);

-- Duplicate Firebase UID provisioning returns the same internal profile and does not reset its wallet.
do $$
declare v_id uuid; v_posted bigint;
begin
  v_id := public.provision_firebase_profile('task003-fixture-firebase-uid-a');
  if v_id <> current_setting('task.profile_a')::uuid then raise exception 'FAIL: UID provisioning changed profile id'; end if;
  select posted_units into v_posted from public.wallet_accounts where profile_id = v_id;
  if v_posted <> 1000 then raise exception 'FAIL: UID provisioning changed wallet projection'; end if;
end $$;

-- Firebase JWT claims scope every client-facing table to one UID, not auth.uid()/email.
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"task003-fixture-firebase-uid-a","iss":"https://securetoken.google.com/nanoware-ai","aud":"nanoware-ai","role":"authenticated"}', true);
do $$
declare v_count bigint; v_rejected boolean := false; v_rows bigint;
begin
  select count(*) into v_count from public.profiles;
  if v_count <> 1 then raise exception 'FAIL: profile isolation'; end if;
  select count(*) into v_count from public.wallet_accounts;
  if v_count <> 1 then raise exception 'FAIL: wallet isolation'; end if;
  select count(*) into v_count from public.conversations;
  if v_count <> 1 then raise exception 'FAIL: conversation isolation'; end if;
  select count(*) into v_count from public.token_ledger;
  if v_count <> 1 then raise exception 'FAIL: raw ledger row isolation'; end if;
  select count(*) into v_count from public.wallet_ledger_public;
  if v_count <> 1 then raise exception 'FAIL: redacted view row isolation/queryability'; end if;
  begin
    perform firebase_uid from public.profiles limit 1;
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: client can read canonical UID column'; end if;
  v_rejected := false;
  begin
    perform metadata from public.token_ledger limit 1;
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: client can read raw ledger metadata'; end if;
  update public.profiles set display_name = 'Test A' where id = current_setting('task.profile_a')::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL: own display name update rejected'; end if;
  v_rejected := false;
  begin
    update public.profiles set deleted_at = now() where id = current_setting('task.profile_a')::uuid;
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: client can update protected profile fields'; end if;
  insert into public.messages (conversation_id, profile_id, role, content, sequence_no)
    values (current_setting('task.conversation_a')::uuid, current_setting('task.profile_a')::uuid, 'user', 'test user message', 1);
  v_rejected := false;
  begin
    insert into public.messages (conversation_id, profile_id, role, content, sequence_no)
      values (current_setting('task.conversation_a')::uuid, current_setting('task.profile_a')::uuid, 'system', 'forbidden client role', 2);
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: authenticated client inserted a system message'; end if;
end $$;
commit;
reset role;

begin;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"task003-fixture-firebase-uid-b","iss":"https://securetoken.google.com/nanoware-ai","aud":"nanoware-ai","role":"authenticated"}', true);
do $$
declare v_count bigint;
begin
  select count(*) into v_count from public.profiles;
  if v_count <> 1 then raise exception 'FAIL: independent user B profile isolation'; end if;
  select count(*) into v_count from public.conversations;
  if v_count <> 1 then raise exception 'FAIL: independent user B conversation isolation'; end if;
  select count(*) into v_count from public.wallet_ledger_public;
  if v_count <> 1 then raise exception 'FAIL: independent user B ledger view isolation'; end if;
end $$;
commit;
reset role;

begin;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"task003-fixture-firebase-uid-a","iss":"https://attacker.invalid/project","aud":"nanoware-ai","role":"authenticated"}', true);
do $$
declare v_count bigint;
begin
  select count(*) into v_count from public.profiles;
  if v_count <> 0 then raise exception 'FAIL: mismatched issuer accessed profile'; end if;
  select count(*) into v_count from public.wallet_ledger_public;
  if v_count <> 0 then raise exception 'FAIL: mismatched issuer accessed ledger view'; end if;
end $$;
commit;
reset role;

do $$
begin
  if has_table_privilege('anon','public.profiles','SELECT') then raise exception 'FAIL: anon can read profiles'; end if;
  if has_table_privilege('anon','public.wallet_ledger_public','SELECT') then raise exception 'FAIL: anon can read ledger view'; end if;
  if has_function_privilege('authenticated','public.provision_firebase_profile(text)','EXECUTE') then raise exception 'FAIL: authenticated can provision profiles'; end if;
  if has_function_privilege('authenticated','public.settle_inference_usage(uuid,uuid,text,bigint,bigint,bigint,bigint,numeric,text,jsonb)','EXECUTE') then raise exception 'FAIL: authenticated can settle usage'; end if;
  if has_table_privilege('service_role','public.token_ledger','INSERT') then raise exception 'FAIL: service_role can bypass accounting RPCs with direct INSERT'; end if;
  if not has_function_privilege('service_role','public.provision_firebase_profile(text)','EXECUTE') then raise exception 'FAIL: service_role lacks provisioning RPC'; end if;
end $$;

-- Model-specific provider cost ranges cannot overlap, and are never converted into OFTens.
do $$
declare v_rejected boolean := false;
begin
  begin
    insert into public.model_price_versions
      (model_id, version, provider_uncached_input_cost_per_million,
       provider_cached_input_cost_per_million, provider_cache_write_cost_per_million,
       provider_output_cost_per_million, provider_cost_currency, effective_from, source)
    values (current_setting('task.model_id')::uuid, 2, 100, 200, 300, 400, 'TEST', now(), 'overlap test');
  exception when raise_exception then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: overlapping model price version accepted'; end if;
end $$;

set role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
select public.create_inference_reservation(
  current_setting('task.profile_a')::uuid, current_setting('task.conversation_a')::uuid,
  current_setting('task.price_id')::uuid, 'task003-infer-a', 'fp-infer-a', 100, now() + interval '1 hour'
) as reservation_a \gset
select set_config('task.request_a', (:'reservation_a'::jsonb ->> 'accounting_request_id'), false);
select set_config('task.inference_a', (:'reservation_a'::jsonb ->> 'inference_request_id'), false);
select public.mark_inference_provider_running(current_setting('task.profile_a')::uuid, current_setting('task.request_a')::uuid);
select public.settle_inference_usage(
  current_setting('task.profile_a')::uuid, current_setting('task.request_a')::uuid,
  'task003-provider-request-a', 40, 10, 5, 20, 0.02, 'TEST', '{"test":true}'::jsonb
) as settlement_a \gset
select set_config('task.settlement_a', :'settlement_a', false);

-- Same request/fingerprint replays; changed fingerprint or provider usage conflicts.
select public.create_inference_reservation(
  current_setting('task.profile_a')::uuid, current_setting('task.conversation_a')::uuid,
  current_setting('task.price_id')::uuid, 'task003-infer-a', 'fp-infer-a', 100, now() + interval '1 hour'
) as reservation_replay \gset
select set_config('task.reservation_replay', :'reservation_replay', false);
reset role;
do $$
declare v_count bigint; v_amount bigint; v_balance bigint; v_hold bigint; v_rejected boolean := false;
begin
  if current_setting('task.reservation_replay')::jsonb ->> 'replayed' <> 'true' then raise exception 'FAIL: reservation idempotency replay'; end if;
  select count(*) into v_count from public.token_ledger where accounting_request_id = current_setting('task.request_a')::uuid and entry_type = 'usage_debit';
  if v_count <> 1 then raise exception 'FAIL: duplicate settlement debit'; end if;
  select amount_units into v_amount from public.token_ledger where accounting_request_id = current_setting('task.request_a')::uuid and entry_type = 'usage_debit';
  if v_amount <> -100 then raise exception 'FAIL: OFTen debit formula (input + 3*output)'; end if;
  select posted_units, held_units into v_balance, v_hold from public.wallet_accounts where profile_id = current_setting('task.profile_a')::uuid;
  if v_balance <> 900 or v_hold <> 0 then raise exception 'FAIL: settlement projection'; end if;
  if (current_setting('task.settlement_a')::jsonb ->> 'estimated_provider_cost')::numeric <> 0.014000000000 then
    raise exception 'FAIL: independent provider cost estimate';
  end if;
  begin
    perform public.settle_inference_usage(current_setting('task.profile_a')::uuid,
      current_setting('task.request_a')::uuid, 'task003-provider-request-a', 41, 10, 5, 20, 0.02, 'TEST', '{"test":true}'::jsonb);
  exception when raise_exception then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: conflicting settlement replay accepted'; end if;
end $$;

-- Bounded partial refunds; a refund must belong to a settled debit.
set role service_role;
select public.apply_inference_refund(current_setting('task.profile_a')::uuid,
  current_setting('task.request_a')::uuid, 30, 'task003-refund-a1', 'test partial correction');
select public.apply_inference_refund(current_setting('task.profile_a')::uuid,
  current_setting('task.request_a')::uuid, 20, 'task003-refund-a2', 'test second partial correction');
reset role;
do $$
declare v_rejected boolean := false;
begin
  begin
    perform public.apply_inference_refund(current_setting('task.profile_a')::uuid,
      current_setting('task.request_a')::uuid, 51, 'task003-refund-over-cap', 'must fail');
  exception when raise_exception then v_rejected := true;
  end;
  if not v_rejected then raise exception 'FAIL: cumulative refund cap not enforced'; end if;
end $$;

-- Verified overage is recorded but not charged beyond the active authorization.
set role service_role;
select public.create_inference_reservation(current_setting('task.profile_a')::uuid,
  current_setting('task.conversation_a')::uuid, current_setting('task.price_id')::uuid,
  'task003-overage', 'fp-overage', 30, now() + interval '1 hour') as overage_reservation \gset
select set_config('task.overage_request', (:'overage_reservation'::jsonb ->> 'accounting_request_id'), false);
select public.settle_inference_usage(current_setting('task.profile_a')::uuid,
  current_setting('task.overage_request')::uuid, 'task003-provider-overage', 40, 0, 0, 0, null, null, '{}'::jsonb);
reset role;
do $$
declare v_status text; v_hold bigint; v_debit_count bigint; v_overage bigint;
begin
  select status into v_status from public.accounting_requests where id = current_setting('task.overage_request')::uuid;
  select held_units into v_hold from public.wallet_accounts where profile_id = current_setting('task.profile_a')::uuid;
  select count(*) into v_debit_count from public.token_ledger where accounting_request_id = current_setting('task.overage_request')::uuid;
  select excess_units into v_overage from public.overage_reconciliations o join public.inference_requests i on i.id=o.inference_request_id where i.accounting_request_id=current_setting('task.overage_request')::uuid;
  if v_status <> 'pending_reconciliation' or v_hold <> 30 or v_debit_count <> 0 or v_overage <> 10 then
    raise exception 'FAIL: overage must remain held and uncharged pending reconciliation';
  end if;
end $$;

-- Verified no-bill release closes the hold without posting a ledger entry.
set role service_role;
select public.create_inference_reservation(current_setting('task.profile_b')::uuid, null,
  current_setting('task.price_id')::uuid, 'task003-release', 'fp-release', 75, now() + interval '1 hour') as release_reservation \gset
select set_config('task.release_request', (:'release_reservation'::jsonb ->> 'accounting_request_id'), false);
select public.release_inference_reservation(current_setting('task.profile_b')::uuid,
  current_setting('task.release_request')::uuid, 'provider-confirmed-no-bill');
reset role;
do $$
declare v_status text; v_held bigint; v_posted bigint; v_entries bigint;
begin
  select status into v_status from public.accounting_requests where id=current_setting('task.release_request')::uuid;
  select posted_units,held_units into v_posted,v_held from public.wallet_accounts where profile_id=current_setting('task.profile_b')::uuid;
  select count(*) into v_entries from public.token_ledger where accounting_request_id=current_setting('task.release_request')::uuid;
  if v_status <> 'released' or v_held <> 0 or v_posted <> 1000 or v_entries <> 0 then raise exception 'FAIL: release accounting'; end if;
end $$;

-- A hold's expiry and identity cannot be changed; ledger rows are append-only.
do $$
declare v_rejected boolean := false; v_hold uuid;
begin
  select id into v_hold from public.reservation_holds where accounting_request_id=current_setting('task.overage_request')::uuid;
  begin update public.reservation_holds set expires_at=expires_at + interval '1 day' where id=v_hold;
  exception when raise_exception then v_rejected := true; end;
  if not v_rejected then raise exception 'FAIL: active hold expiry mutated'; end if;
end $$;

\echo 'PASS: local PostgreSQL foundation assertions completed.'
