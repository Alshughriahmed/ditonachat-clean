#!/usr/bin/env bash
set -e
PORT="${1:-3000}"

# 1) بالاسم
pkill -f "next dev" 2>/dev/null || true
pkill -f "node .*next" 2>/dev/null || true

# 2) عبر npx kill-port (لو متاح)
if command -v npx >/dev/null 2>&1; then
  npx --yes kill-port "$PORT" >/dev/null 2>&1 || true
fi

# 3) فallbacks
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi

if command -v ss >/dev/null 2>&1; then
  PIDS=$(ss -ltnp 2>/dev/null | awk -v p=":${PORT}" '$4 ~ p {print $6}' | sed 's|pid=||; s|,.*||')
  [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null || true
fi

echo "[kill-ports] cleared port ${PORT}"
