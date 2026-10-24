#!/usr/bin/env bash
# Disposable PostgreSQL 16 only. Requires Docker and project Python dependencies.
# Uses a unique container/database; no existing DATABASE_URL is accepted.
set -euo pipefail
cd "$(dirname "$0")/../../.."
command -v docker >/dev/null
audit_name="betton_audit_$(date +%s)_${RANDOM}"
cleanup() { docker rm -f "$audit_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$audit_name" -e POSTGRES_USER=betton -e POSTGRES_PASSWORD=audit_local_only -e POSTGRES_DB="$audit_name" -p 127.0.0.1::5432 postgres:16 >/dev/null
for attempt in $(seq 1 60); do
  if docker exec "$audit_name" pg_isready -U betton -d "$audit_name" >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$audit_name" pg_isready -U betton -d "$audit_name"
audit_port="$(docker port "$audit_name" 5432/tcp | awk -F: '{print $NF}')"
export BETTON_TEST_DATABASE_URL="postgresql+psycopg2://betton:audit_local_only@127.0.0.1:${audit_port}/${audit_name}"
unset DATABASE_URL
"${AUDIT_PYTHON:-python}" -m pytest -o addopts='' -q -s \
  tests/test_p2p_journal_postgres.py tests/test_p2p.py tests/test_p2p_cancel.py \
  tests/test_guarantor_rewards.py tests/test_guarantor_funding.py \
  tests/test_ux_v3_events.py tests/test_demo_guarantors.py \
  docs/audit/evidence/test_audit_followup.py docs/audit/evidence/test_postgres_followup.py \
  | tee docs/audit/evidence/postgres-run.txt
