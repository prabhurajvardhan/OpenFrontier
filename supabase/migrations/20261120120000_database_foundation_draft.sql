-- Open Frontier database foundation draft
-- STATUS: PROPOSED / NOT FOR PRODUCTION.
-- This migration is reversible and requires founder/security approval before deployment.
-- Based on PR #1 correction: reservation holds are separate from the posted ledger.

create extension if not exists pgcrypto;

create type public.inference_request_status as enum
  ('created', 'reserved', 'provider_running', 'settled', 'released', 'pending_reconciliation');
create type public.reservation_hold_status as enum
  ('active', 'settled', 'released', 'expired');
create type public.ledger_entry_type as enum
  ('reward_credit', 'topup_credit', 'usage_debit', 'refund', 'admin_adjustment');
create type public.accounting_request_status as enum
  ('created', 'reserved', 'provider_running', 'settled', 'released', 'pending_reconciliation');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 120)
);

create table public.user_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint conversations_title_length check (title is null or char_length(title) <= 500)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  sequence_no bigint not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (conversation_id, sequence_no),
  constraint messages_content_length check (char_length(content) <= 200000)
);

create table public.model_catalogue (
  id uuid primary key default gen_random_uuid(),
  model_key text not null unique,
  provider_namespace text not null,
  display_name text not null,
  status text not null default 'proposed' check (status in ('proposed', 'active', 'retired')),
  created_at timestamptz not null default now()
);

create table public.model_price_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.model_catalogue(id) on delete restrict,
  version integer not null,
  input_units_per_million bigint not null check (input_units_per_million >= 0),
  cached_input_units_per_million bigint not null check (cached_input_units_per_million >= 0),
  cache_write_units_per_million bigint not null check (cache_write_units_per_million >= 0),
  output_units_per_million bigint not null check (output_units_per_million >= 0),
  wallet_unit text not null,
  rounding_version text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  source text not null,
  created_at timestamptz not null default now(),
  unique (model_id, version),
  constraint model_price_date_range check (effective_to is null or effective_to > effective_from)
);

create table public.wallet_accounts (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  posted_units bigint not null default 0 check (posted_units >= 0),
  held_units bigint not null default 0 check (held_units >= 0),
  available_units bigint generated always as (posted_units - held_units) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_available_nonnegative check (available_units >= 0)
);

create table public.accounting_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null,
  request_fingerprint text not null,
  kind text not null check (kind in ('inference', 'reward', 'topup', 'refund', 'admin_adjustment')),
  status public.accounting_request_status not null default 'created',
  reserved_units bigint not null default 0 check (reserved_units >= 0),
  actual_units bigint check (actual_units is null or actual_units >= 0),
  result_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, idempotency_key)
);

create table public.inference_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  conversation_id uuid references public.conversations(id) on delete restrict,
  model_price_version_id uuid not null references public.model_price_versions(id) on delete restrict,
  accounting_request_id uuid not null unique references public.accounting_requests(id) on delete restrict,
  status public.inference_request_status not null default 'created',
  provider_request_id text,
  provider_status text,
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  cached_input_tokens bigint not null default 0 check (cached_input_tokens >= 0),
  cache_write_tokens bigint not null default 0 check (cache_write_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  actual_units bigint check (actual_units is null or actual_units >= 0),
  overage_units bigint not null default 0 check (overage_units >= 0),
  reconciliation_status text not null default 'not_required'
    check (reconciliation_status in ('not_required', 'pending', 'resolved')),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (provider_request_id)
);

create table public.reservation_holds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  accounting_request_id uuid not null unique references public.accounting_requests(id) on delete restrict,
  reserved_units bigint not null check (reserved_units > 0),
  status public.reservation_hold_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint reservation_closed_at_consistency check (
    (status = 'active' and closed_at is null) or (status <> 'active' and closed_at is not null)
  )
);

create unique index reservation_one_active_per_request
  on public.reservation_holds (accounting_request_id) where status = 'active';

create table public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  accounting_request_id uuid references public.accounting_requests(id) on delete restrict,
  entry_type public.ledger_entry_type not null,
  amount_units bigint not null check (amount_units <> 0),
  operation_id text not null,
  provider_event_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (accounting_request_id, operation_id),
  unique (profile_id, operation_id),
  unique (provider_event_id),
  constraint token_ledger_sign_by_type check (
    (entry_type in ('reward_credit', 'topup_credit', 'refund') and amount_units > 0)
    or (entry_type = 'usage_debit' and amount_units < 0)
    or entry_type = 'admin_adjustment'
  ),
  constraint token_ledger_source_by_type check (
    (entry_type = 'usage_debit' and accounting_request_id is not null)
    or (entry_type in ('reward_credit', 'topup_credit') and provider_event_id is not null)
    or (entry_type = 'refund' and (accounting_request_id is not null or provider_event_id is not null))
    or (entry_type = 'admin_adjustment' and reason is not null and char_length(reason) > 0)
  )
);

create table public.provider_usage_records (
  id uuid primary key default gen_random_uuid(),
  inference_request_id uuid not null references public.inference_requests(id) on delete restrict,
  provider_request_id text,
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  cached_input_tokens bigint not null default 0 check (cached_input_tokens >= 0),
  cache_write_tokens bigint not null default 0 check (cache_write_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  reported_units bigint check (reported_units is null or reported_units >= 0),
  raw_metadata jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (inference_request_id, provider_request_id)
);

create table public.overage_reconciliations (
  id uuid primary key default gen_random_uuid(),
  inference_request_id uuid not null unique references public.inference_requests(id) on delete restrict,
  reserved_units bigint not null check (reserved_units >= 0),
  actual_units bigint not null check (actual_units >= 0),
  excess_units bigint generated always as (actual_units - reserved_units) stored,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'absorbed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint overage_is_positive check (actual_units > reserved_units)
);

create index conversations_owner_updated_idx on public.conversations (profile_id, updated_at desc) where deleted_at is null;
create index messages_conversation_sequence_idx on public.messages (conversation_id, sequence_no);
create index inference_requests_profile_status_idx on public.inference_requests (profile_id, status, created_at desc);
create index accounting_requests_profile_status_idx on public.accounting_requests (profile_id, status, created_at desc);
create index reservation_holds_active_expiry_idx on public.reservation_holds (profile_id, status, expires_at) where status = 'active';
create index token_ledger_profile_created_idx on public.token_ledger (profile_id, created_at desc);

-- Keep the projection guarded and immutable to ordinary clients.
create or replace function public.refresh_wallet_projection(p_profile_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_posted bigint;
  v_held bigint;
begin
  if auth.role() <> 'service_role' and (auth.uid() is null or p_profile_id <> auth.uid()) then
    raise exception 'profile authorization mismatch';
  end if;
  perform 1 from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'profile does not exist'; end if;
  insert into public.wallet_accounts (profile_id) values (p_profile_id)
    on conflict (profile_id) do nothing;
  select coalesce(sum(amount_units), 0) into v_posted from public.token_ledger where profile_id = p_profile_id;
  select coalesce(sum(reserved_units), 0) into v_held from public.reservation_holds where profile_id = p_profile_id and status = 'active';
  if v_posted < v_held then raise exception 'wallet invariant violated for profile %', p_profile_id; end if;
  update public.wallet_accounts set posted_units = v_posted, held_units = v_held, updated_at = now() where profile_id = p_profile_id;
end;
$$;

revoke all on function public.refresh_wallet_projection(uuid) from public, anon, authenticated;
grant execute on function public.refresh_wallet_projection(uuid) to service_role;

create or replace function public.assert_refund_within_debit()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth, pg_temp as $$
declare
  v_debit bigint;
  v_refunded bigint;
begin
  if new.entry_type <> 'refund' then return new; end if;
  if new.accounting_request_id is null then
    raise exception 'refund requires an accounting request';
  end if;
  perform 1 from public.accounting_requests where id = new.accounting_request_id for update;
  select coalesce(-sum(amount_units), 0) into v_debit
    from public.token_ledger
    where accounting_request_id = new.accounting_request_id and entry_type = 'usage_debit';
  select coalesce(sum(amount_units), 0) into v_refunded
    from public.token_ledger
    where accounting_request_id = new.accounting_request_id and entry_type = 'refund';
  if v_refunded + new.amount_units > v_debit then
    raise exception 'refund exceeds settled debit';
  end if;
  return new;
end;
$$;

create trigger token_ledger_refund_cap
  before insert on public.token_ledger
  for each row execute function public.assert_refund_within_debit();
revoke all on function public.assert_refund_within_debit() from public, anon, authenticated;
grant execute on function public.assert_refund_within_debit() to service_role;

-- Supabase RLS: browser sessions can read/write only owned non-financial data.
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.token_ledger enable row level security;
alter table public.reservation_holds enable row level security;
alter table public.inference_requests enable row level security;
alter table public.accounting_requests enable row level security;
alter table public.model_catalogue enable row level security;
alter table public.model_price_versions enable row level security;
alter table public.provider_usage_records enable row level security;
alter table public.overage_reconciliations enable row level security;

create policy profiles_self_select on public.profiles for select using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy preferences_self_all on public.user_preferences for all using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy conversations_owner_all on public.conversations for all using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy messages_owner_select on public.messages for select using (profile_id = (select auth.uid()));
create policy messages_owner_insert on public.messages for insert with check (profile_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and c.profile_id = (select auth.uid())));
create policy wallet_self_select on public.wallet_accounts for select using (profile_id = (select auth.uid()));
create policy ledger_self_select on public.token_ledger for select using (profile_id = (select auth.uid()));
create policy holds_self_select on public.reservation_holds for select using (profile_id = (select auth.uid()));
create policy inference_self_select on public.inference_requests for select using (profile_id = (select auth.uid()));
create policy accounting_self_select on public.accounting_requests for select using (profile_id = (select auth.uid()));
create policy active_model_catalogue_read on public.model_catalogue for select
  using (status = 'active');

-- No INSERT/UPDATE/DELETE policies are intentionally granted on financial tables.
revoke all on public.model_catalogue, public.model_price_versions, public.provider_usage_records, public.overage_reconciliations from anon, authenticated;
revoke all on public.wallet_accounts, public.token_ledger, public.reservation_holds, public.accounting_requests from anon, authenticated;
revoke insert, update, delete on public.inference_requests from anon, authenticated;
grant select on public.model_catalogue to anon, authenticated;
grant select on public.wallet_accounts, public.token_ledger, public.reservation_holds, public.inference_requests, public.accounting_requests to authenticated;

-- Backend settlement contract: lock profile then accounting request, close the hold,
-- insert one usage_debit, update accounting state, and refresh the projection in one
-- transaction. Unique operation IDs make retries replayable; callers must return the
-- stored result for a terminal request instead of inserting a second debit.

-- Seed is deliberately empty: pricing/models require founder approval and environment-specific review.
