#!/usr/bin/env bash
set -Eeuo pipefail
slug="${REPL_SLUG:-}"; owner="${REPL_OWNER:-}"
candidates=("$slug.$owner.replit.dev" "$slug-$owner.replit.dev" "$slug.$owner.repl.co" "$slug-$owner.repl.co" "$(hostname -f 2>/dev/null)")
pick=""
for h in "${candidates[@]}"; do
  [[ -z "$h" ]] && continue
  if curl -sSfL "https://$h/api/health" >/dev/null 2>&1; then pick="https://$h"; break; fi
done
echo "Chat:  ${pick:-http://localhost:3000}/chat"
echo "Debug: ${pick:-http://localhost:3000}/debug"
