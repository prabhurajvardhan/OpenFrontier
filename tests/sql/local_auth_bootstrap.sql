-- Test-only shim for the Supabase auth functions used by these migrations.
-- Run only in the disposable local PostgreSQL database created by the test harness.
do $roles$
begin
  create role anon nologin;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role authenticated nologin;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null;
end
$roles$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

create or replace function auth.jwt()
returns jsonb language sql stable
set search_path = pg_catalog, pg_temp as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.role()
returns text language sql stable
set search_path = pg_catalog, pg_temp as $$
  select auth.jwt() ->> 'role'
$$;
grant execute on function auth.jwt() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
