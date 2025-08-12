#!/usr/bin/env bash
set -Eeuo pipefail
echo "== Ditonachat Doctor =="
echo "[1] Node/NPM/Next"
node -v || true
npm -v || true
npx --yes next --version || true

echo "[2] Directories (top)"
ls -la | sed -n '1,120p'
[ -d app ] && echo "app/ exists" || echo "app/ MISSING"
[ -f next.config.js ] && head -n 40 next.config.js || echo "next.config.js MISSING"

echo "[3] Port 3000"
if command -v lsof >/dev/null 2>&1; then
  lsof -i:3000 -P -n || true
else
  echo "lsof not available"
fi

echo "[4] Key env presence (no values):"
for v in DATABASE_URL NEXTAUTH_URL NEXT_PUBLIC_SOCKET_URL NEXT_PUBLIC_APP_URL STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN; do
  if [ -n "${!v:-}" ]; then echo "$v=SET"; else echo "$v=MISSING"; fi
done
