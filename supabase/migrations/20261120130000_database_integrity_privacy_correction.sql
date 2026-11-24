-- Open Frontier database integrity/privacy correction 002
-- STATUS: PROPOSED / NOT FOR PRODUCTION.
-- Ordered after 20261120120000_database_foundation_draft.sql.
-- This is a targeted follow-up; the original foundation migration is preserved.

-- DB-CORR-01: make ownership part of every account-scoped relationship.
alter table public.accounting_requests
  add constraint accounting_requests_profile_id_id_key unique (profile_id, id);
alter table public.conversations
  add constraint conversations_profile_id_id_key unique (profile_id, id);
alter table public.inference_requests
  add constraint inference_requests_profile_id_id_key unique (profile_id, id);

alter table public.inference_requests
  drop constraint if exists inference_requests_accounting_request_id_fkey,
  drop constraint if exists inference_requests_conversation_id_fkey;
alter table public.inference_requests
  add constraint inference_requests_profile_accounting_request_fkey
    foreign key (profile_id, accounting_request_id)
    references public.accounting_requests (profile_id, id) on delete restrict,
  add constraint inference_requests_profile_conversation_fkey
    foreign key (profile_id, conversation_id)
    references public.conversations (profile_id, id) on delete restrict;

alter table public.reservation_holds
  drop constraint if exists reservation_holds_accounting_request_id_fkey;
alter table public.reservation_holds
  add constraint reservation_holds_profile_accounting_request_fkey
    foreign key (profile_id, accounting_request_id)
    references public.accounting_requests (profile_id, id) on delete restrict;

alter table public.token_ledger
  drop constraint if exists token_ledger_accounting_request_id_fkey;
alter table public.token_ledger
  add constraint token_ledger_profile_accounting_request_fkey
    foreign key (profile_id, accounting_request_id)
    references public.accounting_requests (profile_id, id) on delete restrict;

-- DB-CORR-02: refunds always point to the original accounting request.
alter table public.token_ledger
  drop constraint if exists token_ledger_source_by_type;
alter table public.token_ledger
  add constraint token_ledger_source_by_type check (
    (entry_type = 'usage_debit' and accounting_request_id is not null)
    or (entry_type in ('reward_credit', 'topup_credit') and provider_event_id is not null)
    or (entry_type = 'refund' and accounting_request_id is not null)
    or (entry_type = 'admin_adjustment' and reason is not null and char_length(reason) > 0)
  );

create or replace function public.assert_refund_within_debit()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_request_status public.accounting_request_status;
  v_debit bigint;
  v_refunded bigint;
begin
  if new.entry_type <> 'refund' then return new; end if;
  select status into v_request_status
    from public.accounting_requests
    where id = new.accounting_request_id and profile_id = new.profile_id
    for update;
  if not found or v_request_status <> 'settled' then
    raise exception 'refund requires a settled accounting request';
  end if;
  select coalesce(-sum(amount_units), 0) into v_debit
    from public.token_ledger
    where accounting_request_id = new.accounting_request_id and entry_type = 'usage_debit';
  select coalesce(sum(amount_units), 0) into v_refunded
    from public.token_ledger
    where accounting_request_id = new.accounting_request_id and entry_type = 'refund';
  if v_debit <= 0 or v_refunded + new.amount_units > v_debit then
    raise exception 'refund exceeds settled debit';
  end if;
  return new;
end;
$$;

-- DB-CORR-03: expose only a redacted, ownership-filtered ledger view.
create or replace view public.wallet_ledger_public
with (security_invoker = true) as
select
  id,
  entry_type,
  amount_units,
  created_at,
  case entry_type
    when 'reward_credit' then 'reward'
    when 'topup_credit' then 'top-up'
    when 'usage_debit' then 'usage'
    when 'refund' then 'refund'
    when 'admin_adjustment' then 'adjustment'
  end as reason
from public.token_ledger;

revoke all on public.token_ledger from anon, authenticated;
grant select (id, entry_type, amount_units, created_at) on public.token_ledger to authenticated;
revoke all on public.wallet_ledger_public from anon;
grant select on public.wallet_ledger_public to authenticated;

-- DB-CORR-04: all wallet mutations lock profile first, then request.
create or replace function public.lock_wallet_mutation()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
begin
  perform 1 from public.profiles where id = new.profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  if tg_table_name = 'token_ledger' and new.accounting_request_id is not null then
    perform 1 from public.accounting_requests
      where id = new.accounting_request_id and profile_id = new.profile_id for update;
    if not found then raise exception 'accounting request ownership mismatch'; end if;
  elsif tg_table_name = 'reservation_holds' then
    perform 1 from public.accounting_requests
      where id = new.accounting_request_id and profile_id = new.profile_id for update;
    if not found then raise exception 'accounting request ownership mismatch'; end if;
  end if;
  return new;
end;
$$;

create trigger aa_lock_wallet_ledger_insert
  before insert on public.token_ledger
  for each row execute function public.lock_wallet_mutation();
create trigger aa_lock_wallet_hold_insert
  before insert on public.reservation_holds
  for each row execute function public.lock_wallet_mutation();

create or replace function public.reject_ledger_mutation()
returns trigger language plpgsql
set search_path = pg_catalog, public, pg_temp as $$
begin
  raise exception 'token_ledger is append-only';
end;
$$;
create trigger token_ledger_append_only_update
  before update on public.token_ledger
  for each row execute function public.reject_ledger_mutation();
create trigger token_ledger_append_only_delete
  before delete on public.token_ledger
  for each row execute function public.reject_ledger_mutation();

create or replace function public.guard_reservation_hold_transition()
returns trigger language plpgsql
set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.profile_id <> old.profile_id
     or new.accounting_request_id <> old.accounting_request_id
     or new.reserved_units <> old.reserved_units
     or new.expires_at <> old.expires_at
     or new.created_at <> old.created_at then
    raise exception 'reservation hold identity is immutable';
  end if;
  if old.status <> 'active' then
    if new.status <> old.status or new.closed_at <> old.closed_at then
      raise exception 'terminal reservation hold is immutable';
    end if;
    return new;
  end if;
  if new.status not in ('active', 'settled', 'released', 'expired') then
    raise exception 'invalid reservation hold transition';
  end if;
  if new.status = 'active' and new.closed_at is not null then
    raise exception 'active reservation hold cannot have a closed_at timestamp';
  end if;
  if new.status <> 'active' and new.closed_at is null then
    raise exception 'terminal reservation hold requires a closed_at timestamp';
  end if;
  return new;
end;
$$;
create trigger reservation_hold_transition_guard
  before update on public.reservation_holds
  for each row execute function public.guard_reservation_hold_transition();

revoke all on function public.lock_wallet_mutation() from public, anon, authenticated;
revoke all on function public.reject_ledger_mutation() from public, anon, authenticated;
revoke all on function public.guard_reservation_hold_transition() from public, anon, authenticated;
grant execute on function public.lock_wallet_mutation() to service_role;
grant execute on function public.reject_ledger_mutation() to service_role;
grant execute on function public.guard_reservation_hold_transition() to service_role;

-- The service-role settlement function must lock profiles, then accounting_requests,
-- then close the hold, insert one debit, update state, and refresh projection in one
-- transaction. Terminal retries return result_json; they never insert another debit.


-- DB-CORR-05: Firebase UID is the canonical owner key; UUID profile IDs remain internal FKs.
create or replace function public.provision_firebase_profile(p_firebase_uid text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_profile_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'profile provisioning requires service_role';
  end if;
  if p_firebase_uid is null or char_length(p_firebase_uid) not between 1 and 128 then
    raise exception 'invalid Firebase UID';
  end if;
  insert into public.profiles (firebase_uid)
    values (p_firebase_uid)
    on conflict (firebase_uid) do nothing
    returning id into v_profile_id;
  if v_profile_id is null then
    select id into v_profile_id from public.profiles where firebase_uid = p_firebase_uid;
  end if;
  if v_profile_id is null then raise exception 'Firebase profile lookup failed'; end if;
  -- Rebuild from the append-only ledger and active holds; never set/grant a balance.
  perform public.refresh_wallet_projection(v_profile_id);
  return v_profile_id;
end;
$$;

-- Reserve atomically: same-profile requests serialize before idempotency lookup and balance check.
create or replace function public.create_inference_reservation(
  p_profile_id uuid,
  p_conversation_id uuid,
  p_model_price_version_id uuid,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_reserved_units bigint,
  p_expires_at timestamptz
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_request_id uuid;
  v_inference_id uuid;
  v_hold_id uuid;
  v_fingerprint text;
  v_kind text;
  v_status public.accounting_request_status;
  v_existing_result jsonb;
  v_available bigint;
  v_result jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'reservation requires service_role'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 200
     or p_request_fingerprint is null or char_length(p_request_fingerprint) not between 1 and 512
     or p_reserved_units is null or p_reserved_units <= 0
     or p_expires_at is null or p_expires_at <= clock_timestamp() then
    raise exception 'invalid reservation arguments';
  end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  perform public.refresh_wallet_projection(p_profile_id);
  if p_conversation_id is not null and not exists (
    select 1 from public.conversations c where c.id = p_conversation_id and c.profile_id = p_profile_id
  ) then raise exception 'conversation ownership mismatch'; end if;
  if not exists (
    select 1 from public.model_price_versions p
      join public.model_catalogue m on m.id = p.model_id
    where p.id = p_model_price_version_id and m.status = 'active'
      and p.effective_from <= clock_timestamp()
      and (p.effective_to is null or p.effective_to > clock_timestamp())
  ) then raise exception 'model price version is not active'; end if;

  select id, request_fingerprint, kind, status, result_json
    into v_request_id, v_fingerprint, v_kind, v_status, v_existing_result
    from public.accounting_requests
    where profile_id = p_profile_id and idempotency_key = p_idempotency_key
    for update;
  if found then
    if v_fingerprint <> p_request_fingerprint then raise exception 'idempotency fingerprint conflict'; end if;
    if v_kind <> 'inference' or v_existing_result is null then raise exception 'idempotency key is bound to an incompatible request'; end if;
    return v_existing_result || jsonb_build_object('replayed', true);
  end if;

  select available_units into v_available from public.wallet_accounts
    where profile_id = p_profile_id for update;
  if v_available < p_reserved_units then raise exception 'insufficient available OFTens'; end if;
  insert into public.accounting_requests
    (profile_id, idempotency_key, request_fingerprint, kind, status, reserved_units)
    values (p_profile_id, p_idempotency_key, p_request_fingerprint, 'inference', 'reserved', p_reserved_units)
    returning id into v_request_id;
  insert into public.inference_requests
    (profile_id, conversation_id, model_price_version_id, accounting_request_id, status)
    values (p_profile_id, p_conversation_id, p_model_price_version_id, v_request_id, 'reserved')
    returning id into v_inference_id;
  insert into public.reservation_holds
    (profile_id, accounting_request_id, reserved_units, expires_at)
    values (p_profile_id, v_request_id, p_reserved_units, p_expires_at)
    returning id into v_hold_id;
  v_result := jsonb_build_object(
    'replayed', false, 'accounting_request_id', v_request_id,
    'inference_request_id', v_inference_id, 'reservation_hold_id', v_hold_id,
    'reserved_units', p_reserved_units, 'status', 'reserved'
  );
  update public.accounting_requests set result_json = v_result, updated_at = clock_timestamp() where id = v_request_id;
  perform public.refresh_wallet_projection(p_profile_id);
  return v_result;
end;
$$;

create or replace function public.mark_inference_provider_running(p_profile_id uuid, p_accounting_request_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare v_status public.accounting_request_status;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'provider transition requires service_role'; end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  select status into v_status from public.accounting_requests
    where id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'accounting request not found'; end if;
  if v_status = 'provider_running' then return; end if;
  if v_status <> 'reserved' then raise exception 'request cannot enter provider_running from %', v_status; end if;
  if not exists (select 1 from public.reservation_holds
      where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id and status = 'active') then
    raise exception 'active reservation hold missing';
  end if;
  update public.accounting_requests set status = 'provider_running', updated_at = clock_timestamp() where id = p_accounting_request_id;
  update public.inference_requests set status = 'provider_running' where accounting_request_id = p_accounting_request_id;
end;
$$;

create or replace function public.mark_inference_pending_reconciliation(
  p_profile_id uuid, p_accounting_request_id uuid, p_reason text
) returns void language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare v_status public.accounting_request_status; v_result jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'reconciliation transition requires service_role'; end if;
  if p_reason is null or char_length(btrim(p_reason)) = 0 then raise exception 'reconciliation reason is required'; end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  select status, result_json into v_status, v_result from public.accounting_requests
    where id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'accounting request not found'; end if;
  if v_status = 'pending_reconciliation' then
    if v_result ->> 'kind' = 'provider_settlement' then return; end if;
    if v_result ->> 'reason' = p_reason then return; end if;
    raise exception 'conflicting reconciliation reason';
  end if;
  if v_status not in ('reserved', 'provider_running') then raise exception 'request cannot be reconciled from %', v_status; end if;
  if not exists (select 1 from public.reservation_holds
      where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id and status = 'active') then
    raise exception 'active reservation hold missing';
  end if;
  update public.accounting_requests set status = 'pending_reconciliation',
    result_json = jsonb_build_object('kind', 'uncertain_provider_outcome', 'reason', p_reason),
    updated_at = clock_timestamp() where id = p_accounting_request_id;
  update public.inference_requests set status = 'pending_reconciliation', reconciliation_status = 'pending'
    where accounting_request_id = p_accounting_request_id;
end;
$$;

-- Verified provider usage is always recorded. OFTen debit is input + 3*output; provider cost is separate.
-- If usage exceeds the authorized hold, preserve it and keep the hold pending; never silently overdraw.
create or replace function public.settle_inference_usage(
  p_profile_id uuid,
  p_accounting_request_id uuid,
  p_provider_request_id text,
  p_input_tokens bigint,
  p_cached_input_tokens bigint,
  p_cache_write_tokens bigint,
  p_output_tokens bigint,
  p_reported_provider_cost numeric,
  p_reported_provider_cost_currency text,
  p_provider_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_status public.accounting_request_status;
  v_saved_result jsonb;
  v_inference_id uuid;
  v_price_id uuid;
  v_hold_id uuid;
  v_hold_status public.reservation_hold_status;
  v_reserved bigint;
  v_units numeric;
  v_uncached_rate numeric(30,12);
  v_cached_rate numeric(30,12);
  v_cache_write_rate numeric(30,12);
  v_output_rate numeric(30,12);
  v_cost_currency text;
  v_estimated_cost numeric(30,12);
  v_candidate jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'settlement requires service_role'; end if;
  if p_provider_request_id is null or char_length(btrim(p_provider_request_id)) = 0
     or p_input_tokens is null or p_input_tokens < 0
     or p_cached_input_tokens is null or p_cached_input_tokens < 0
     or p_cache_write_tokens is null or p_cache_write_tokens < 0
     or p_output_tokens is null or p_output_tokens < 0
     or p_cached_input_tokens > p_input_tokens
     or p_cache_write_tokens > p_input_tokens - p_cached_input_tokens
     or p_reported_provider_cost < 0
     or (p_reported_provider_cost is null) <> (p_reported_provider_cost_currency is null)
     or (p_reported_provider_cost_currency is not null and char_length(p_reported_provider_cost_currency) not between 1 and 12) then
    raise exception 'invalid provider usage or cost arguments';
  end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  select status, result_json into v_status, v_saved_result from public.accounting_requests
    where id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'accounting request not found'; end if;
  select id, model_price_version_id into v_inference_id, v_price_id from public.inference_requests
    where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'inference request not found'; end if;
  select id, status, reserved_units into v_hold_id, v_hold_status, v_reserved from public.reservation_holds
    where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'reservation hold not found'; end if;
  select provider_uncached_input_cost_per_million, provider_cached_input_cost_per_million,
         provider_cache_write_cost_per_million, provider_output_cost_per_million, provider_cost_currency
    into v_uncached_rate, v_cached_rate, v_cache_write_rate, v_output_rate, v_cost_currency
    from public.model_price_versions where id = v_price_id;
  v_units := p_input_tokens::numeric + p_output_tokens::numeric * 3;
  if v_units > 9223372036854775807 then raise exception 'calculated OFTen debit exceeds supported range'; end if;
  v_estimated_cost := (
    (p_input_tokens - p_cached_input_tokens - p_cache_write_tokens)::numeric * v_uncached_rate
    + p_cached_input_tokens::numeric * v_cached_rate
    + p_cache_write_tokens::numeric * v_cache_write_rate
    + p_output_tokens::numeric * v_output_rate
  ) / 1000000;
  v_candidate := jsonb_build_object(
    'kind', 'provider_settlement', 'provider_request_id', p_provider_request_id,
    'input_tokens', p_input_tokens, 'cached_input_tokens', p_cached_input_tokens,
    'cache_write_tokens', p_cache_write_tokens, 'output_tokens', p_output_tokens,
    'of_tens_debit', v_units::bigint, 'reported_provider_cost', p_reported_provider_cost,
    'reported_provider_cost_currency', p_reported_provider_cost_currency,
    'estimated_provider_cost', v_estimated_cost, 'estimated_cost_currency', v_cost_currency,
    'provider_metadata', coalesce(p_provider_metadata, '{}'::jsonb),
    'status', case when v_units > v_reserved then 'pending_reconciliation' else 'settled' end
  );
  if v_status in ('settled', 'pending_reconciliation') and v_saved_result ->> 'kind' = 'provider_settlement' then
    if v_saved_result = v_candidate then return v_saved_result; end if;
    raise exception 'conflicting provider settlement replay';
  end if;
  if v_status not in ('reserved', 'provider_running', 'pending_reconciliation') then
    raise exception 'request cannot settle from %', v_status;
  end if;
  if v_hold_status <> 'active' then raise exception 'active reservation hold missing'; end if;

  insert into public.provider_usage_records
    (inference_request_id, provider_request_id, input_tokens, cached_input_tokens,
     cache_write_tokens, output_tokens, reported_provider_cost, reported_provider_cost_currency,
     estimated_provider_cost, estimated_cost_currency, raw_metadata)
    values (v_inference_id, p_provider_request_id, p_input_tokens, p_cached_input_tokens,
      p_cache_write_tokens, p_output_tokens, p_reported_provider_cost, p_reported_provider_cost_currency,
      v_estimated_cost, v_cost_currency, coalesce(p_provider_metadata, '{}'::jsonb));
  update public.inference_requests set provider_request_id = p_provider_request_id,
    provider_status = 'usage_verified', input_tokens = p_input_tokens,
    cached_input_tokens = p_cached_input_tokens, cache_write_tokens = p_cache_write_tokens,
    output_tokens = p_output_tokens, actual_units = v_units::bigint,
    overage_units = greatest(0, v_units::bigint - v_reserved),
    reconciliation_status = case when v_units > v_reserved then 'pending' else 'not_required' end
    where id = v_inference_id;

  if v_units > v_reserved then
    insert into public.overage_reconciliations (inference_request_id, reserved_units, actual_units, status)
      values (v_inference_id, v_reserved, v_units::bigint, 'pending');
    update public.accounting_requests set status = 'pending_reconciliation', actual_units = v_units::bigint,
      result_json = v_candidate, updated_at = clock_timestamp() where id = p_accounting_request_id;
    update public.inference_requests set status = 'pending_reconciliation' where id = v_inference_id;
    return v_candidate;
  end if;

  update public.reservation_holds set status = 'settled', closed_at = clock_timestamp() where id = v_hold_id;
  if v_units > 0 then
    insert into public.token_ledger
      (profile_id, accounting_request_id, entry_type, amount_units, operation_id, reason)
      values (p_profile_id, p_accounting_request_id, 'usage_debit', -(v_units::bigint),
        'usage-debit:' || v_inference_id::text, 'verified provider usage');
  end if;
  update public.accounting_requests set status = 'settled', actual_units = v_units::bigint,
    result_json = v_candidate, updated_at = clock_timestamp() where id = p_accounting_request_id;
  update public.inference_requests set status = 'settled', settled_at = clock_timestamp() where id = v_inference_id;
  perform public.refresh_wallet_projection(p_profile_id);
  return v_candidate;
end;
$$;

create or replace function public.release_inference_reservation(
  p_profile_id uuid, p_accounting_request_id uuid, p_no_bill_evidence text
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare v_status public.accounting_request_status; v_saved jsonb; v_inference_id uuid; v_hold_id uuid;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'release requires service_role'; end if;
  if p_no_bill_evidence is null or char_length(btrim(p_no_bill_evidence)) = 0 then raise exception 'authoritative no-bill evidence is required'; end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  select status, result_json into v_status, v_saved from public.accounting_requests
    where id = p_accounting_request_id and profile_id = p_profile_id for update;
  if not found then raise exception 'accounting request not found'; end if;
  if v_status = 'released' then
    if v_saved = jsonb_build_object('kind','released','no_bill_evidence',p_no_bill_evidence) then
      return v_saved || jsonb_build_object('replayed', true);
    end if;
    raise exception 'conflicting release replay';
  end if;
  if v_status not in ('reserved', 'provider_running', 'pending_reconciliation') then raise exception 'request cannot release from %', v_status; end if;
  select id into v_inference_id from public.inference_requests
    where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id for update;
  select id into v_hold_id from public.reservation_holds
    where accounting_request_id = p_accounting_request_id and profile_id = p_profile_id and status = 'active' for update;
  if v_hold_id is null then raise exception 'active reservation hold missing'; end if;
  update public.reservation_holds set status = 'released', closed_at = clock_timestamp() where id = v_hold_id;
  update public.accounting_requests set status = 'released',
    result_json = jsonb_build_object('kind','released','no_bill_evidence',p_no_bill_evidence),
    updated_at = clock_timestamp() where id = p_accounting_request_id;
  update public.inference_requests set status = 'released', reconciliation_status = 'resolved'
    where id = v_inference_id;
  perform public.refresh_wallet_projection(p_profile_id);
  return jsonb_build_object('kind','released','no_bill_evidence',p_no_bill_evidence,'replayed',false);
end;
$$;

create or replace function public.apply_inference_refund(
  p_profile_id uuid, p_accounting_request_id uuid, p_amount_units bigint,
  p_operation_id text, p_reason text, p_provider_event_id text default null
) returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare v_saved_amount bigint; v_saved_request uuid; v_saved_reason text; v_saved_event text; v_entry_id uuid;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'refund requires service_role'; end if;
  if p_amount_units is null or p_amount_units <= 0 or p_operation_id is null
     or char_length(btrim(p_operation_id)) = 0 or p_reason is null or char_length(btrim(p_reason)) = 0 then
    raise exception 'invalid refund arguments';
  end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  perform 1 from public.accounting_requests where id = p_accounting_request_id
    and profile_id = p_profile_id and status = 'settled' for update;
  if not found then raise exception 'refund requires a settled accounting request'; end if;
  select id, amount_units, accounting_request_id, reason, provider_event_id
    into v_entry_id, v_saved_amount, v_saved_request, v_saved_reason, v_saved_event
    from public.token_ledger where profile_id = p_profile_id and operation_id = p_operation_id;
  if found then
    if v_saved_amount = p_amount_units and v_saved_request = p_accounting_request_id
       and v_saved_reason = p_reason and v_saved_event is not distinct from p_provider_event_id then
      return jsonb_build_object('ledger_entry_id',v_entry_id,'amount_units',v_saved_amount,'replayed',true);
    end if;
    raise exception 'conflicting refund operation replay';
  end if;
  insert into public.token_ledger
    (profile_id, accounting_request_id, entry_type, amount_units, operation_id, provider_event_id, reason)
    values (p_profile_id, p_accounting_request_id, 'refund', p_amount_units, p_operation_id, p_provider_event_id, p_reason)
    returning id into v_entry_id;
  perform public.refresh_wallet_projection(p_profile_id);
  return jsonb_build_object('ledger_entry_id',v_entry_id,'amount_units',p_amount_units,'replayed',false);
end;
$$;

-- Sensitive mutations are RPC-only. Existing profiles/wallets are preserved; provisioning is UID-only.
revoke insert, update, delete on public.profiles, public.wallet_accounts, public.accounting_requests,
  public.inference_requests, public.reservation_holds, public.token_ledger,
  public.provider_usage_records, public.overage_reconciliations from anon, authenticated, service_role;
grant update (display_name) on public.profiles to authenticated;
revoke all on function public.provision_firebase_profile(text) from public, anon, authenticated;
revoke all on function public.create_inference_reservation(uuid,uuid,uuid,text,text,bigint,timestamptz) from public, anon, authenticated;
revoke all on function public.mark_inference_provider_running(uuid,uuid) from public, anon, authenticated;
revoke all on function public.mark_inference_pending_reconciliation(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.settle_inference_usage(uuid,uuid,text,bigint,bigint,bigint,bigint,numeric,text,jsonb) from public, anon, authenticated;
revoke all on function public.release_inference_reservation(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.apply_inference_refund(uuid,uuid,bigint,text,text,text) from public, anon, authenticated;
grant execute on function public.provision_firebase_profile(text) to service_role;
grant execute on function public.create_inference_reservation(uuid,uuid,uuid,text,text,bigint,timestamptz) to service_role;
grant execute on function public.mark_inference_provider_running(uuid,uuid) to service_role;
grant execute on function public.mark_inference_pending_reconciliation(uuid,uuid,text) to service_role;
grant execute on function public.settle_inference_usage(uuid,uuid,text,bigint,bigint,bigint,bigint,numeric,text,jsonb) to service_role;
grant execute on function public.release_inference_reservation(uuid,uuid,text) to service_role;
grant execute on function public.apply_inference_refund(uuid,uuid,bigint,text,text,text) to service_role;
