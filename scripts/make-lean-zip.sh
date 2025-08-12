#!/usr/bin/env bash
set -euo pipefail

# تأكد إنك داخل مجلد فيه package.json وsrc وprisma
for d in package.json src prisma; do
  [ -e "$d" ] || { echo "❌ Run this from the project root (ditonachat-clean). Missing: $d"; exit 1; }
done

EXPORT="../ditonachat-clean-LEAN-$(date +%Y%m%d_%H%M%S).zip"
EXCL="export-exclude.lst"

cat > "$EXCL" <<'X'
node_modules/*
.next/*
dist/*
build/*
coverage/*
.cache/*
.upm/*
.vercel/*
.turbo/*
.vscode/*
.idea/*
logs/*
artifacts/*
env_backups/*
backups/*
backup_fixes/*
attached_assets/*
health/*
**/*.bak
**/*.bak.*
**/*.old
**/*~
**/*.swp
**/.DS_Store
**/Thumbs.db
.env
.env.bak*
dev.db
dev.db-journal
*.sqlite
*.sqlite3
ngrok
ngrok.exe
ngrok-*
stripe.tar.gz
*.zip
*.tar
*.tar.gz
X

echo "==> Project size before:"
du -sh . || true

# نطبع المستبعدات للشفافية
echo -e "\n==> Excluding patterns:"
nl -ba "$EXCL" | sed 's/^/  /'

# جرّب zip، ولو مو متوفر نستخدم tar.gz
if command -v zip >/dev/null 2>&1; then
  # حوّل القائمة لسطر واحد
  EXARGS=$(tr '\n' ' ' < "$EXCL")
  echo -e "\n==> Creating ZIP: $EXPORT"
  # نحط ملف .env.example لو موجود؛ ما نستبعده
  zip -r "$EXPORT" . -x $EXARGS
elif command -v tar >/dev/null 2>&1; then
  EXPORT="${EXPORT%.zip}.tar.gz"
  echo -e "\n==> Creating TAR.GZ: $EXPORT"
  tar -czf "$EXPORT" --exclude-from="$EXCL" .
else
  echo "❌ Neither 'zip' nor 'tar' found."
  exit 1
fi

echo -e "\n==> Done. File:"
ls -lh "$EXPORT"

echo -e "\n==> Quick listing (top 30):"
if [[ "$EXPORT" == *.zip ]]; then
  unzip -l "$EXPORT" | head -n 30 || true
else
  tar -tzf "$EXPORT" | head -n 30 || true
fi

echo -e "\n✅ LEAN export ready: $EXPORT"
