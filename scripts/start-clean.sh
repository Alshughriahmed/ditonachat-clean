#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# اقتل أي تشغيل قديم
./scripts/kill-ports.sh 3000

# تنظيف ثقيل
rm -rf .next node_modules

# تثبيت نظيف
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# Prisma (لو السكيمة موجودة)
if [ -f prisma/schema.prisma ]; then
  npx prisma generate
  npx prisma db push
fi

# تشغيل Next
next dev -H 0.0.0.0 -p 3000
