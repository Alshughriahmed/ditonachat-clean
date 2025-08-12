#!/usr/bin/env bash
set -Eeuo pipefail
echo "[nuke] freeing :3000"
if command -v lsof >/dev/null 2>&1; then
  p=$(lsof -t -i:3000 || true)
  [ -n "$p" ] && { echo "[nuke] kill -> $p"; kill -9 $p || true; }
fi
pkill -f "node .*next.*dev" 2>/dev/null || true
pkill -f "node_modules/next/dist/bin/next" 2>/dev/null || true
pkill -f "scripts/dev-run.sh" 2>/dev/null || true
sleep 1
rm -f .dev-run.lock
echo "[nuke] check :3000"; lsof -i:3000 -P -n 2>/dev/null || true
