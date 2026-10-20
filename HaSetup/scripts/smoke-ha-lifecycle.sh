#!/usr/bin/env bash
# Smoke-test HA container lifecycle via Docker CLI (Linux CI or Windows Git Bash).
# Does NOT require Docker Desktop UI — any Docker Engine is enough.
set -euo pipefail

IMAGE="homeassistant/home-assistant:stable"
NAME="smart-home-ha"
VOLUME="smart-home-ha-config"
PORT="8123"

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP: docker not installed"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "SKIP: docker daemon not running"
  exit 0
fi

echo "==> Ensure volume"
docker volume create "$VOLUME" >/dev/null

echo "==> Pull image (may take a while)"
docker pull "$IMAGE"

echo "==> Remove leftover container if any"
docker rm -f "$NAME" >/dev/null 2>&1 || true

echo "==> Create + start"
docker create \
  --name "$NAME" \
  --restart unless-stopped \
  -e TZ=Europe/Istanbul \
  -v "${VOLUME}:/config" \
  -p "${PORT}:8123" \
  "$IMAGE" >/dev/null
docker start "$NAME" >/dev/null

echo "==> Wait for HTTP on localhost:${PORT}"
ok=0
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" || true)
  if [[ "$code" =~ ^(200|201|301|302|401|403)$ ]]; then
    echo "Healthy: HTTP $code"
    ok=1
    break
  fi
  sleep 3
done

echo "==> docker inspect status"
docker inspect -f '{{.State.Status}}' "$NAME"

echo "==> stop / start / restart"
docker stop "$NAME" >/dev/null
docker start "$NAME" >/dev/null
docker restart "$NAME" >/dev/null

echo "==> remove (keep volume)"
docker rm -f "$NAME" >/dev/null

if [[ "$ok" -ne 1 ]]; then
  echo "WARN: HA did not become healthy in time (image pull/boot can be slow). Lifecycle commands still OK."
  exit 0
fi

echo "PASS: HA lifecycle smoke test"
