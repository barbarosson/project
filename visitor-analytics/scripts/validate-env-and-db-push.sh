#!/usr/bin/env bash
# SitePulse — validate env + prisma db push (Supabase).
# Usage (from visitor-analytics/ or repo root):
#   ./scripts/validate-env-and-db-push.sh
#   npm run db:validate-push
#
# Does not invent secrets. Exits non-zero when required URLs are missing.
# Never prints secret values — only presence / shape checks.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
elif [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

ok=0
warn=0
fail=0

have() {
  local name="$1"
  local val="${!name-}"
  if [[ -n "${val}" ]]; then
    echo "  OK   $name is set"
    ok=$((ok + 1))
    return 0
  fi
  echo "  MISS $name"
  fail=$((fail + 1))
  return 1
}

shape_hint() {
  local name="$1"
  local val="${!name-}"
  local expect="$2"
  [[ -z "$val" ]] && return 0
  case "$expect" in
    pooled)
      if [[ "$val" == *":6543"* ]] || [[ "$val" == *"pgbouncer=true"* ]]; then
        echo "  OK   $name looks pooled (6543 / pgbouncer)"
      else
        echo "  WARN $name set but does not look like Supabase transaction pooler (:6543 + pgbouncer=true)"
        warn=$((warn + 1))
      fi
      ;;
    direct)
      if [[ "$val" == *":5432"* ]] && [[ "$val" != *"pgbouncer=true"* ]]; then
        echo "  OK   $name looks direct (:5432, no pgbouncer)"
      else
        echo "  WARN $name set but may be wrong for prisma db push (want :5432 without pgbouncer=true)"
        warn=$((warn + 1))
      fi
      ;;
  esac
}

echo "SitePulse env check (visitor-analytics/)"
echo "----------------------------------------"

have DATABASE_URL || true
shape_hint DATABASE_URL pooled

have DIRECT_URL || true
shape_hint DIRECT_URL direct

if have AUTH_SECRET; then
  if [[ ${#AUTH_SECRET} -lt 32 ]]; then
    echo "  WARN AUTH_SECRET length < 32 (generate with: openssl rand -base64 32)"
    warn=$((warn + 1))
  fi
fi

if [[ -n "${NEXT_PUBLIC_APP_URL-}" ]]; then
  echo "  OK   NEXT_PUBLIC_APP_URL is set"
  if [[ "${NEXT_PUBLIC_APP_URL}" == */ ]]; then
    echo "  WARN NEXT_PUBLIC_APP_URL has a trailing slash — remove it"
    warn=$((warn + 1))
  fi
  ok=$((ok + 1))
else
  echo "  WARN NEXT_PUBLIC_APP_URL unset (set after Netlify URL is known)"
  warn=$((warn + 1))
fi

ls_vars=(
  LEMONSQUEEZY_API_KEY
  LEMONSQUEEZY_STORE_ID
  LEMONSQUEEZY_WEBHOOK_SECRET
  LEMONSQUEEZY_VARIANT_STARTER
  LEMONSQUEEZY_VARIANT_AGENCY
  LEMONSQUEEZY_VARIANT_SCALE
)
ls_present=0
for v in "${ls_vars[@]}"; do
  if [[ -n "${!v-}" ]]; then
    ls_present=$((ls_present + 1))
  fi
done
if [[ "$ls_present" -eq 0 ]]; then
  echo "  INFO Lemon Squeezy vars unset — checkout stays stubbed (OK for first boot)"
elif [[ "$ls_present" -lt ${#ls_vars[@]} ]]; then
  echo "  WARN Lemon Squeezy partially set ($ls_present/${#ls_vars[@]}) — complete before selling"
  warn=$((warn + 1))
else
  echo "  OK   Lemon Squeezy env complete ($ls_present/${#ls_vars[@]})"
  ok=$((ok + 1))
fi

echo "----------------------------------------"
echo "Summary: ok=$ok warn=$warn miss=$fail"

if [[ -z "${DATABASE_URL-}" || -z "${DIRECT_URL-}" ]]; then
  echo ""
  echo "Blocked: set DATABASE_URL + DIRECT_URL in visitor-analytics/.env then re-run."
  echo "  See DEPLOY.md § A (Supabase) or store docs/launch-checklist.md"
  echo "  Do NOT reuse moduluscursor NEXT_PUBLIC_SUPABASE_* — SitePulse needs Postgres URIs."
  exit 1
fi

echo ""
echo "Running: npx prisma db push (uses DIRECT_URL via schema directUrl)"
if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found"
  exit 1
fi

if [[ ! -d node_modules/prisma ]]; then
  echo "Installing deps (npm install)…"
  npm install
fi

npx prisma db push
echo "Done. Optional seed (skip on clean prod): npm run db:seed"
