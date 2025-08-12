#!/usr/bin/env bash
set -Eeuo pipefail
LOG=logs/dev-bg.log
PIDF=.dev.pid
PORT="${PORT:-3000}"

start() {
  ./scripts/pm.sh stop || true
  echo "[pm] starting on :$PORT ..."
  nohup bash -lc 'NEXT_TELEMETRY_DISABLED=1 ./scripts/dev-run.sh' > "$LOG" 2>&1 & echo $! > "$PIDF"
  echo "[pm] pid $(cat $PIDF)"
  for i in {1..30}; do
    if curl -sSfL "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
      echo "[pm] health OK"; exit 0
    fi
    sleep 0.5
  done
  echo "[pm] health check FAILED"; tail -n 80 "$LOG" || true; exit 1
}

stop() {
  if [ -f "$PIDF" ]; then
    pid=$(cat "$PIDF" || true)
    [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null || true
    rm -f "$PIDF"
  fi
  if command -v lsof >/dev/null 2>&1; then
    p=$(lsof -t -i:$PORT || true)
    [ -n "$p" ] && kill -9 $p || true
  fi
  rm -f .dev-run.lock
  echo "[pm] stopped"
}

status() {
  if [ -f "$PIDF" ] && ps -p "$(cat $PIDF)" >/dev/null 2>&1; then
    echo "[pm] running pid $(cat $PIDF)"
  else
    echo "[pm] not running"
  fi
}

logs() { tail -f "$LOG"; }

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  logs) logs ;;
  *) echo "usage: $0 {start|stop|status|logs}" ; exit 1 ;;
esac
