#!/usr/bin/env bash
set -Eeuo pipefail

sep(){ printf "\n%s\n" "==================== $* ===================="; }

sep "BASIC"
echo "PWD: $(pwd)"
echo "Node: $(node -v) | NPM: $(npm -v)"
npx --yes next --version || true

sep "GIT"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Branch: $(git branch --show-current || true)"
  echo "Status:"
  git status -s -uno || true
else
  echo "Not a git repo."
fi

sep "TOP-LEVEL DIRS (depth<=2)"
if command -v tree >/dev/null 2>&1; then
  tree -L 2 -I "node_modules|.next|.git|ARCHIVE_OLD|logs"
else
  find . -maxdepth 2 -type d \
    -not -path "./node_modules*" -not -path "./.next*" -not -path "./.git*" -not -path "./ARCHIVE_OLD*" -not -path "./logs*" \
    | sort
fi

sep "SIZES"
du -sh ./* 2>/dev/null | sort -h || true

sep "PACKAGE.JSON (scripts + deps)"
node <<'NODE'
const fs=require('fs');
try{
  const pj=JSON.parse(fs.readFileSync('package.json','utf8'));
  console.log(JSON.stringify({
    name: pj.name, version: pj.version,
    scripts: pj.scripts,
    deps: Object.keys(pj.dependencies||{}),
    devDeps: Object.keys(pj.devDependencies||{})
  }, null, 2));
}catch(e){ console.log("package.json missing or invalid"); }
NODE

sep "TSCONFIG (compilerOptions)"
node <<'NODE'
const fs=require('fs');
try{
  const tc=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
  console.log(JSON.stringify({ compilerOptions: tc.compilerOptions || null }, null, 2));
}catch(e){ console.log("tsconfig.json missing"); }
NODE

# Detect app root
APPROOT="app"
[ -d "src/app" ] && APPROOT="src/app"

sep "APP ROOT"
echo "APPROOT=$APPROOT"
[ -d "$APPROOT" ] || echo "Missing $APPROOT directory!"

sep "ROUTES: pages/layouts (depth<=2)"
find "$APPROOT" \( -name 'page.tsx' -o -name 'layout.tsx' \) -maxdepth 2 -type f 2>/dev/null | sort || true

sep "API ROUTES"
[ -d "$APPROOT/api" ] && find "$APPROOT/api" -type f -name 'route.ts' | sort || echo "No API routes"

sep "COMPONENTS"
ls -la src/components 2>/dev/null || ls -la components 2>/dev/null || echo "no components dir"

sep "PRISMA"
if [ -f prisma/schema.prisma ]; then
  echo "-- provider/db --"
  grep -nE 'datasource|provider|url|generator' prisma/schema.prisma || true
  echo "-- head (first 200 lines) --"
  nl -ba prisma/schema.prisma | sed -n '1,200p'
else
  echo "schema.prisma missing"
fi
[ -f dev.db ] && echo "SQLite file: dev.db exists" || echo "SQLite file: dev.db NOT found"
[ -f prisma/dev.db ] && echo "SQLite prisma/dev.db exists" || true
npx prisma validate || true

sep "ENV PRESENCE (.env.local)"
for k in DATABASE_URL NEXTAUTH_URL NEXT_PUBLIC_SOCKET_URL NEXT_PUBLIC_APP_URL NEXT_PUBLIC_SITE_URL \
         STRIPE_MODE STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET \
         STRIPE_PRO_WEEKLY_ID STRIPE_VIP_MONTHLY_ID STRIPE_ELITE_YEARLY_ID STRIPE_BOOST_ME_DAILY_ID \
         UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN DISABLE_REDIS; do
  if grep -q "^$k=" .env.local 2>/dev/null; then echo "$k=SET (.env.local)"; else echo "$k=MISS (.env.local)"; fi
done

sep "SOCKET/ SIGNALING references"
grep -RIn --exclude-dir=node_modules --exclude-dir=.next -E "socket\.io|new Server|io\(|NEXT_PUBLIC_SOCKET_URL|SIGNALING_URL" src app 2>/dev/null || true

sep "WEBRTC references"
grep -RIn --exclude-dir=node_modules --exclude-dir=.next -E "RTCPeerConnection|getUserMedia|RTCIceServer" src app 2>/dev/null || true

sep "NEXT CONFIG (first 120 lines)"
[ -f next.config.js ] && sed -n '1,120p' next.config.js || true
[ -f next.config.mjs ] && sed -n '1,120p' next.config.mjs || true

sep "DONE"
