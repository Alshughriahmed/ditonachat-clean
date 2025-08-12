#!/usr/bin/env bash
set -Eeuo pipefail

echo "▶️ Bootstrapping Ditonachat (dev)…"

# أ) كتابة .env.local من القيم المزوّدة
cat > .env.local <<'ENV'
# === DEV ENV (لا ترفعه على Git) ===
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-nextauth-secret-here"

UPSTASH_REDIS_REST_URL="https://<UPSTASH_REDIS_REST_URL>"
UPSTASH_REDIS_REST_TOKEN="<UPSTASH_REDIS_REST_TOKEN>"

NODE_ENV=development
PORT=3000

# Stripe (تنبيه: هذه تبدو Live)
STRIPE_SECRET_KEY="sk_live_REPLACE_ME"
STRIPE_PUBLISHABLE_KEY="pk_live_51QxDitonaChatPublicKeyRealExample"
STRIPE_WEBHOOK_SECRET="whsec_DitonaChatWebhookRealExample"

# Redis / Upstash
REDIS_URL="redis://default:DitonaRedisPass2025@eu1-thoughtful-rabbit-39218.upstash.io:6379"
REDIS_TOKEN="DitonaRedisTokenRealExample"
DISABLE_REDIS=1

# OAuth
GOOGLE_CLIENT_ID="1234567890-abcdefghijklmno.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GgDitonaGoogleSecret2025"
FACEBOOK_CLIENT_ID="123456789012345"
FACEBOOK_CLIENT_SECRET="FbDitonaSecret2025"
INSTAGRAM_CLIENT_ID="1234567890abcdef"
INSTAGRAM_CLIENT_SECRET="IgDitonaSecret2025"

# Network / URLs
PUBLIC_IP="91.99.227.144"
NEXT_PUBLIC_SIGNALING_URL="https://example-signaling.example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Frontend Stripe (حاليًا Test key — راجع لاحقًا)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_xxx"

# Plans
STRIPE_PRO_WEEKLY_ID="price_xxx"
STRIPE_VIP_MONTHLY_ID="price_xxx"
STRIPE_ELITE_YEARLY_ID="price_xxx"
STRIPE_BOOST_ME_DAILY_ID="price_xxx"
ENV

echo "✅ Wrote .env.local"

# ب) إصلاح سكربتات package.json (build/start/dev)
if [ -f package.json ]; then
  node <<'NODE'
  const fs = require('fs');
  const pj = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pj.scripts ||= {};
  pj.scripts.build = "next build";
  pj.scripts.start = "next start -H 0.0.0.0 -p ${PORT:-3000}";
  pj.scripts.dev = pj.scripts.dev || "next dev -H 0.0.0.0 -p ${PORT:-3000}";
  pj.scripts["type-check"] = "tsc -p . --noEmit";
  fs.writeFileSync('package.json', JSON.stringify(pj, null, 2));
  console.log("✅ Updated package.json scripts");
NODE
else
  echo "⚠️ package.json غير موجود!"
fi

# ج) تثبيت الحزم (إن لم تكن موجودة)
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies…"
  npm install
else
  echo "📦 Dependencies already installed."
fi

# د) Prisma checks
echo "🧩 Prisma validate…"
npx prisma validate || true
echo "🧩 Prisma generate…"
npx prisma generate
echo "🧩 Prisma db push (SQLite dev)…"
npx prisma db push

# هـ) سكربتات اختبار سريعة
cat > scripts/dev-tests/test-stripe.mjs <<'JS'
import Stripe from "stripe";
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY"); process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prices = await stripe.prices.list({ limit: 10 });
console.log("Prices count:", prices.data.length);
for (const p of prices.data) {
  console.log(`- ${p.id} | ${p.nickname || "no-nickname"} | ${p.currency} ${p.unit_amount/100 || "?"}`);
}
JS

cat > scripts/dev-tests/test-redis.mjs <<'JS'
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) { console.error("Missing UPSTASH envs"); process.exit(1); }
const res = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` }});
console.log("Upstash status:", res.status, await res.text());
JS

echo "✅ Wrote test scripts"

echo "ℹ️ جاهز. شغّل اختبارات Stripe/Redis يدويًا إذا أردت:"
echo "   node scripts/dev-tests/test-stripe.mjs"
echo "   node scripts/dev-tests/test-redis.mjs"

echo "🚀 لتشغيل المشروع:"
echo "   npm run dev"
