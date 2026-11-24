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

# Force a disposable projection drift, then race provisioning with direct projection rebuilds.
expected_posted=$(query "select coalesce(sum(amount_units),0)::bigint from public.token_ledger where profile_id='$profile_a'")
expected_held=$(query "select coalesce(sum(reserved_units),0)::bigint from public.reservation_holds where profile_id='$profile_a' and status='active'")
expected_available=$((expected_posted - expected_held))
ledger_count_before=$(query "select count(*) from public.token_ledger where profile_id='$profile_a'")
ledger_sum_before=$(query "select coalesce(sum(amount_units),0) from public.token_ledger where profile_id='$profile_a'")
ledger_hash_before=$(query "select md5(coalesce(string_agg(to_jsonb(l)::text, E'\\n' order by l.id),'')) from public.token_ledger l where l.profile_id='$profile_a'")
query "update public.wallet_accounts set posted_units=posted_units+1 where profile_id='$profile_a'" >/dev/null

provision_sql() {
  printf "begin; set local role service_role; %s select public.provision_firebase_profile('task003-fixture-firebase-uid-a'); select pg_sleep(0.4); commit;\n" "$claims"
}
projection_sql() {
  printf "begin; set local role service_role; %s select public.refresh_wallet_projection('%s'); select pg_sleep(0.4); commit;\n" "$claims" "$profile_a"
}
provision_sql | "${psql_cmd[@]}" -At >"$tmp/provision-a.log" 2>&1 & p1=$!
provision_sql | "${psql_cmd[@]}" -At >"$tmp/provision-b.log" 2>&1 & p2=$!
projection_sql | "${psql_cmd[@]}" >"$tmp/projection-a.log" 2>&1 & p3=$!
projection_sql | "${psql_cmd[@]}" >"$tmp/projection-b.log" 2>&1 & p4=$!
set +e
wait "$p1"; rp1=$?
wait "$p2"; rp2=$?
wait "$p3"; rp3=$?
wait "$p4"; rp4=$?
set -e
if [[ $rp1 -ne 0 || $rp2 -ne 0 || $rp3 -ne 0 || $rp4 -ne 0 ]]; then
  cat "$tmp/provision-a.log" "$tmp/provision-b.log" "$tmp/projection-a.log" "$tmp/projection-b.log" >&2
  echo "FAIL: concurrent provisioning/projection rebuild returned $rp1,$rp2,$rp3,$rp4" >&2
  exit 1
fi
provisioned_ids=$(grep -hE '^[0-9a-f-]{36}$' "$tmp/provision-a.log" "$tmp/provision-b.log" | sort -u || true)
[[ "$provisioned_ids" == "$profile_a" ]] || {
  cat "$tmp/provision-a.log" "$tmp/provision-b.log" >&2
  echo "FAIL: concurrent provisioning returned unexpected profile IDs: $provisioned_ids" >&2; exit 1;
}
profile_count=$(query "select count(*) from public.profiles where firebase_uid='task003-fixture-firebase-uid-a'")
[[ "$profile_count" == 1 ]] || { echo "FAIL: concurrent provisioning created $profile_count profiles for one Firebase UID" >&2; exit 1; }
ledger_count_after=$(query "select count(*) from public.token_ledger where profile_id='$profile_a'")
ledger_sum_after=$(query "select coalesce(sum(amount_units),0) from public.token_ledger where profile_id='$profile_a'")
ledger_hash_after=$(query "select md5(coalesce(string_agg(to_jsonb(l)::text, E'\\n' order by l.id),'')) from public.token_ledger l where l.profile_id='$profile_a'")
[[ "$ledger_count_after" == "$ledger_count_before" && "$ledger_sum_after" == "$ledger_sum_before" && "$ledger_hash_after" == "$ledger_hash_before" ]] || {
  echo "FAIL: concurrent provisioning/rebuild changed token ledger history" >&2; exit 1;
}
wallet_after=$(query "select posted_units::text || '|' || held_units::text || '|' || available_units::text from public.wallet_accounts where profile_id='$profile_a'")
wallet_expected="$expected_posted|$expected_held|$expected_available"
[[ "$wallet_after" == "$wallet_expected" ]] || { echo "FAIL: concurrent projection rebuild left wallet '$wallet_after', expected '$wallet_expected'" >&2; exit 1; }
echo "PASS: concurrent provisioning and projection rebuilds retained one profile, ledger history, and ledger-derived wallet totals."
