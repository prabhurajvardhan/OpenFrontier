#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
db="${TASK003_TEST_DB:-openfrontier_task003_${$}}"
if [[ "$(id -un)" == postgres ]]; then
  psql_cmd=(psql -X -P pager=off -v ON_ERROR_STOP=1 -d "$db")
  createdb_cmd=(createdb)
  dropdb_cmd=(dropdb --if-exists)
else
  psql_cmd=(sudo -n -u postgres psql -X -P pager=off -v ON_ERROR_STOP=1 -d "$db")
  createdb_cmd=(sudo -n -u postgres createdb)
  dropdb_cmd=(sudo -n -u postgres dropdb --if-exists)
fi
cleanup() { "${dropdb_cmd[@]}" "$db" >/dev/null 2>&1 || true; }
trap cleanup EXIT

if [[ "$(id -un)" != postgres ]]; then sudo -n service postgresql start >/dev/null; fi
"${createdb_cmd[@]}" "$db"
cd "$root"
"${psql_cmd[@]}" -f tests/sql/local_auth_bootstrap.sql
"${psql_cmd[@]}" -f supabase/migrations/20261120120000_database_foundation_draft.sql
"${psql_cmd[@]}" -f tests/sql/database_foundation_rollback_snapshot.sql
"${psql_cmd[@]}" -f supabase/migrations/20261120130000_database_integrity_privacy_correction.sql
"${psql_cmd[@]}" -f tests/sql/database_foundation_runtime.sql
bash tests/run-concurrency-tests.sh "$db"
"${psql_cmd[@]}" -f supabase/rollback/20261120130000_database_integrity_privacy_correction.sql
"${psql_cmd[@]}" -f tests/sql/database_foundation_rollback_assert.sql
"${psql_cmd[@]}" -f supabase/migrations/20261120130000_database_integrity_privacy_correction.sql
"${psql_cmd[@]}" -f supabase/rollback/20261120130000_database_integrity_privacy_correction.sql
"${psql_cmd[@]}" -f supabase/rollback/20261120120000_database_foundation_draft.sql
"${psql_cmd[@]}" -f supabase/migrations/20261120120000_database_foundation_draft.sql
"${psql_cmd[@]}" -f supabase/migrations/20261120130000_database_integrity_privacy_correction.sql
echo "PASS: disposable PostgreSQL migrations, runtime checks, rollback comparison, and reapplication completed (database $db)."
