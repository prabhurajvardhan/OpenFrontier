-- Rollback for 20261120120000_database_foundation_draft.sql
-- STATUS: PROPOSED / NOT FOR PRODUCTION. Run only against a disposable database.

drop policy if exists accounting_self_select on public.accounting_requests;
drop policy if exists inference_self_select on public.inference_requests;
drop policy if exists active_model_catalogue_read on public.model_catalogue;
drop policy if exists holds_self_select on public.reservation_holds;
drop policy if exists ledger_self_select on public.token_ledger;
drop policy if exists wallet_self_select on public.wallet_accounts;
drop policy if exists messages_owner_insert on public.messages;
drop policy if exists messages_owner_select on public.messages;
drop policy if exists conversations_owner_all on public.conversations;
drop policy if exists preferences_self_all on public.user_preferences;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_self_select on public.profiles;

drop trigger if exists token_ledger_refund_cap on public.token_ledger;
drop trigger if exists model_price_versions_no_overlap on public.model_price_versions;
drop function if exists public.guard_model_price_no_overlap();
drop function if exists public.assert_refund_within_debit();
drop function if exists public.refresh_wallet_projection(uuid);
drop table if exists public.overage_reconciliations;
drop table if exists public.provider_usage_records;
drop table if exists public.token_ledger;
drop table if exists public.reservation_holds;
drop table if exists public.inference_requests;
drop table if exists public.accounting_requests;
drop table if exists public.wallet_accounts;
drop table if exists public.model_price_versions;
drop table if exists public.model_catalogue;
drop table if exists public.messages;
drop table if exists public.conversations;
drop table if exists public.user_preferences;
drop table if exists public.profiles;
drop function if exists public.owns_profile(uuid);
drop function if exists public.current_firebase_uid();
drop type if exists public.ledger_entry_type;
drop type if exists public.reservation_hold_status;
drop type if exists public.accounting_request_status;
drop type if exists public.inference_request_status;
