#!/usr/bin/env bash
set -euo pipefail

db=${1:?usage: run-concurrency-tests.sh DISPOSABLE_DB}
if [[ "$(id -un)" == postgres ]]; then
  psql_cmd=(psql -X -P pager=off -v ON_ERROR_STOP=1 -d "$db")
else
  psql_cmd=(sudo -n -u postgres psql -X -P pager=off -v ON_ERROR_STOP=1 -d "$db")
fi
query() { "${psql_cmd[@]}" -At -c "$1"; }
profile_b=$(query "select id from public.profiles where firebase_uid='task003-fixture-firebase-uid-b'")
profile_a=$(query "select id from public.profiles where firebase_uid='task003-fixture-firebase-uid-a'")
model_id=$(query "select id from public.model_catalogue where model_key='task003-disposable-model'")
price_id=$(query "select id from public.model_price_versions where model_id='$model_id' and version=1")
request_a=$(query "select id from public.accounting_requests where idempotency_key='task003-infer-a'")
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
claims="set local request.jwt.claims = '{\"role\":\"service_role\"}';"

reserve_sql() {
  local key=$1 fp=$2
  printf "begin; set local role service_role; %s select public.create_inference_reservation('%s',null,'%s','%s','%s',600,now()+interval '1 hour'); select pg_sleep(0.4); commit;\n" \
    "$claims" "$profile_b" "$price_id" "$key" "$fp"
}
reserve_sql task003-race-reserve-a fp-race-a | "${psql_cmd[@]}" >"$tmp/reserve-a.log" 2>&1 & a=$!
reserve_sql task003-race-reserve-b fp-race-b | "${psql_cmd[@]}" >"$tmp/reserve-b.log" 2>&1 & b=$!
set +e
wait "$a"; ra=$?
wait "$b"; rb=$?
set -e
if ! { [[ $ra -eq 0 && $rb -ne 0 ]] || [[ $ra -ne 0 && $rb -eq 0 ]]; }; then
  cat "$tmp/reserve-a.log" "$tmp/reserve-b.log" >&2
  echo "FAIL: concurrent reservations should have exactly one success (exit codes $ra,$rb)" >&2
  exit 1
fi
active_reserved=$(query "select coalesce(sum(reserved_units),0) from public.reservation_holds where profile_id='$profile_b' and status='active'")
[[ "$active_reserved" == 600 ]] || { echo "FAIL: concurrent reservation hold total is $active_reserved" >&2; exit 1; }
echo "PASS: concurrent reservations serialized; one 600-unit hold was accepted."

settle_sql="begin; set local role service_role; $claims select public.settle_inference_usage('$profile_a','$request_a','task003-provider-request-a',40,10,5,20,0.02,'TEST','{\"test\":true}'::jsonb); select pg_sleep(0.4); commit;"
printf '%s\n' "$settle_sql" | "${psql_cmd[@]}" >"$tmp/settle-a.log" 2>&1 & a=$!
printf '%s\n' "$settle_sql" | "${psql_cmd[@]}" >"$tmp/settle-b.log" 2>&1 & b=$!
wait "$a"; wait "$b"
debit_count=$(query "select count(*) from public.token_ledger where accounting_request_id='$request_a' and entry_type='usage_debit'")
[[ "$debit_count" == 1 ]] || { cat "$tmp/settle-a.log" "$tmp/settle-b.log" >&2; echo "FAIL: duplicate concurrent settlement inserted $debit_count debits" >&2; exit 1; }
echo "PASS: duplicate concurrent settlement replayed one terminal result and one debit."

refund_sql() {
  local operation=$1
  printf "begin; set local role service_role; %s select public.apply_inference_refund('%s','%s',30,'%s','concurrent test refund'); select pg_sleep(0.4); commit;\n" \
    "$claims" "$profile_a" "$request_a" "$operation"
}
refund_sql task003-race-refund-a | "${psql_cmd[@]}" >"$tmp/refund-a.log" 2>&1 & a=$!
refund_sql task003-race-refund-b | "${psql_cmd[@]}" >"$tmp/refund-b.log" 2>&1 & b=$!
set +e
wait "$a"; ra=$?
wait "$b"; rb=$?
set -e
if ! { [[ $ra -eq 0 && $rb -ne 0 ]] || [[ $ra -ne 0 && $rb -eq 0 ]]; }; then
  cat "$tmp/refund-a.log" "$tmp/refund-b.log" >&2
  echo "FAIL: capped concurrent refunds should have exactly one success (exit codes $ra,$rb)" >&2
  exit 1
fi
refunded=$(query "select coalesce(sum(amount_units),0) from public.token_ledger where accounting_request_id='$request_a' and entry_type='refund'")
[[ "$refunded" == 80 ]] || { echo "FAIL: concurrent refunds total is $refunded (expected 80)" >&2; exit 1; }
echo "PASS: concurrent refunds serialized at the settled-debit cap."
