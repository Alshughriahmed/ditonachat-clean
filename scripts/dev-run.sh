#!/usr/bin/env bash
set -Eeuo pipefail

PORT="${PORT:-${PORT_OVERRIDE:-3000}}"

# منع تشغيل نسخة ثانية
exec 9>./.dev-run.lock
if ! flock -n 9; then
  echo "[dev-run] another instance is already running."
  exit 1
fi

echo "== Ditonachat DEV RUN =="
echo "PWD: $(pwd)"
echo "PORT: ${PORT}"

# حرر البورت
if command -v lsof >/dev/null 2>&1; then
  pid=$(lsof -t -i:${PORT} || true)
  [ -n "$pid" ] && { echo "Killing processes on :${PORT} -> ${pid}"; kill -9 ${pid} || true; }
fi
export NEXT_TELEMETRY_DISABLED=1

echo "Node: $(node -v) | NPM: $(npm -v)"
echo "Next version: $(npx --yes next --version || true)"

echo "Starting Next dev on 0.0.0.0:${PORT} ..."
exec node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p "${PORT}"
