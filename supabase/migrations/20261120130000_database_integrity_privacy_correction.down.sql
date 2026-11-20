-- Rollback for 20261120130000_database_integrity_privacy_correction.sql
-- STATUS: PROPOSED / NOT FOR PRODUCTION. Run only on a disposable database.

drop trigger if exists reservation_hold_transition_guard on public.reservation_holds;
drop trigger if exists token_ledger_append_only_delete on public.token_ledger;
drop trigger if exists token_ledger_append_only_update on public.token_ledger;
drop trigger if exists aa_lock_wallet_hold_insert on public.reservation_holds;
drop trigger if exists aa_lock_wallet_ledger_insert on public.token_ledger;
drop function if exists public.guard_reservation_hold_transition();
drop function if exists public.reject_ledger_mutation();
drop function if exists public.lock_wallet_mutation();
drop view if exists public.wallet_ledger_public;

alter table public.token_ledger
  drop constraint if exists token_ledger_profile_accounting_request_fkey;
alter table public.reservation_holds
  drop constraint if exists reservation_holds_profile_accounting_request_fkey;
alter table public.inference_requests
  drop constraint if exists inference_requests_profile_conversation_fkey,
  drop constraint if exists inference_requests_profile_accounting_request_fkey;

alter table public.token_ledger
  add constraint token_ledger_accounting_request_id_fkey
    foreign key (accounting_request_id) references public.accounting_requests(id) on delete restrict;
alter table public.reservation_holds
  add constraint reservation_holds_accounting_request_id_fkey
    foreign key (accounting_request_id) references public.accounting_requests(id) on delete restrict;
alter table public.inference_requests
  add constraint inference_requests_accounting_request_id_fkey
    foreign key (accounting_request_id) references public.accounting_requests(id) on delete restrict,
  add constraint inference_requests_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete restrict;

alter table public.token_ledger
  drop constraint if exists token_ledger_source_by_type;
alter table public.token_ledger
  add constraint token_ledger_source_by_type check (
    (entry_type = 'usage_debit' and accounting_request_id is not null)
    or (entry_type in ('reward_credit', 'topup_credit') and provider_event_id is not null)
    or (entry_type = 'refund' and (accounting_request_id is not null or provider_event_id is not null))
    or (entry_type = 'admin_adjustment' and reason is not null and char_length(reason) > 0)
  );

alter table public.accounting_requests drop constraint if exists accounting_requests_profile_id_id_key;
alter table public.conversations drop constraint if exists conversations_profile_id_id_key;
alter table public.inference_requests drop constraint if exists inference_requests_profile_id_id_key;

grant select on public.token_ledger to authenticated;
