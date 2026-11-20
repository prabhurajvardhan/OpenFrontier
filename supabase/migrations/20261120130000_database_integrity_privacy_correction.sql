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

revoke select on public.token_ledger from anon, authenticated;
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
     or new.reserved_units <> old.reserved_units then
    raise exception 'reservation hold identity is immutable';
  end if;
  if old.status <> 'active' and new.status <> old.status then
    raise exception 'terminal reservation hold cannot transition';
  end if;
  if old.status = 'active' and new.status not in ('active', 'settled', 'released', 'expired') then
    raise exception 'invalid reservation hold transition';
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
