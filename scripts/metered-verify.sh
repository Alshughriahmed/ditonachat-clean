#!/usr/bin/env bash
set -Eeuo pipefail

echo "▶️ Metered TURN verify…"
cd "$(dirname "$0")/.."

# 1) اقرأ/ثبّت البيئة
set -a; source .env.local 2>/dev/null || true; set +a
METERED_BASE="${METERED_BASE:-https://ditonachat.metered.live}"
METERED_SECRET_KEY="${METERED_SECRET_KEY:-XQ6bkNoUfdJjmqm4sFa2KQVHf9_3FjrPZbtzlPLreAPHkDKs}"

grep -q '^METERED_BASE=' .env.local || echo "METERED_BASE=$METERED_BASE" >> .env.local
grep -q '^METERED_SECRET_KEY=' .env.local || echo "METERED_SECRET_KEY=$METERED_SECRET_KEY" >> .env.local
cp -f .env.local .env

# 2) أنشئ apiKey مؤقت إذا مش موجود
set -a; source .env.local; set +a
if [ -z "${METERED_TURN_API_KEY:-}" ]; then
  echo "ℹ️ Creating TURN apiKey with secretKey…"
  LABEL="ditona-dev-$(date +%F_%H%M%S)"
  TURN_JSON=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"expiryInSeconds\":43200,\"label\":\"$LABEL\"}" \
    "$METERED_BASE/api/v1/turn/credential?secretKey=$METERED_SECRET_KEY")
  echo "$TURN_JSON" > logs/metered-turn-create.json || true
  TURN_API_KEY=$(node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const k=j.apiKey||j.key||(j.data&&j.data.apiKey)||'';process.stdout.write(String(k));}catch{process.stdout.write('');}})" <<< "$TURN_JSON")
  if [ -z "$TURN_API_KEY" ]; then
    echo "❌ Failed to get apiKey. Response:"; tail -c 400 logs/metered-turn-create.json || cat logs/metered-turn-create.json; exit 1
  fi
  if grep -q '^METERED_TURN_API_KEY=' .env.local; then
    sed -i -E "s|^METERED_TURN_API_KEY=.*|METERED_TURN_API_KEY=$TURN_API_KEY|" .env.local
  else
    echo "METERED_TURN_API_KEY=$TURN_API_KEY" >> .env.local
  fi
  export METERED_TURN_API_KEY="$TURN_API_KEY"
  cp -f .env.local .env
  echo "✅ Saved METERED_TURN_API_KEY (${#METERED_TURN_API_KEY} chars)"
else
  echo "✅ Existing METERED_TURN_API_KEY detected (${#METERED_TURN_API_KEY} chars)"
fi

# 3) اكتب /api/turn بشكل مؤكد
mkdir -p src/app/api/turn
cat > src/app/api/turn/route.ts <<'TS'
import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.METERED_BASE;
  const apiKey = process.env.METERED_TURN_API_KEY || process.env.METERED_API_KEY;
  if (!base || !apiKey) return NextResponse.json({ iceServers: [], error: 'Missing METERED_TURN_API_KEY' });
  try {
    const url = `${base}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Metered ${r.status}`);
    const j = await r.json();
    const ice = Array.isArray(j) ? j : (j.iceServers || []);
    return NextResponse.json({ iceServers: ice });
  } catch (e:any) {
    return NextResponse.json({ iceServers: [], error: e.message });
  }
}
TS

# 4) Restart التطبيق
./scripts/pm.sh stop >/dev/null 2>&1 || true
./scripts/pm.sh start

# 5) اختبارات: Remote + Local
set -a; source .env.local; set +a
echo "== Remote test (apiKey) =="
curl -s "$METERED_BASE/api/v1/turn/credentials?apiKey=$METERED_TURN_API_KEY" | head -c 400; echo
echo "== Local /api/turn =="
curl -s "http://localhost:3000/api/turn" | head -c 400; echo

# 6) اطبع رابط خارجي
if [ -x ./scripts/guess-preview-url.sh ]; then
  ./scripts/guess-preview-url.sh
else
  slug="${REPL_SLUG:-}"; owner="${REPL_OWNER:-}"
  if [ -n "$slug" ] && [ -n "$owner" ]; then
    echo "Preview (guess): https://$slug.$owner.replit.dev"
  else
    echo "Preview at: http://localhost:3000"
  fi
fi
echo "➡ افتح /webrtc-diag واضغط Run. ثم جرّب /chat من جهازين."
