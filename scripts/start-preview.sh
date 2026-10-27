#!/usr/bin/env bash
# Start the show-me-the-design preview server.
#
# Usage: start-preview.sh --design-dir <path> [--port <n>] [--host <host>] [--foreground]
#
# Prints the preview JSON on success, including the gallery URL.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DESIGN_DIR=""
PORT="0"
HOST="127.0.0.1"
FOREGROUND="false"

usage() {
  cat <<'EOF'
Usage: start-preview.sh --design-dir <path> [--port <n>] [--host <host>] [--foreground]

  --design-dir <path>  Design workspace to serve (created if missing).
  --port <n>           Port to bind. Default: 0 (random free port).
  --host <host>        Bind address. Default: 127.0.0.1.
  --foreground         Run in the foreground instead of backgrounding.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --design-dir)
      DESIGN_DIR="${2:-}"
      shift 2
      ;;
    --design-dir=*)
      DESIGN_DIR="${1#*=}"
      shift
      ;;
    --port)
      PORT="${2:-0}"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --host)
      HOST="${2:-127.0.0.1}"
      shift 2
      ;;
    --host=*)
      HOST="${1#*=}"
      shift
      ;;
    --foreground)
      FOREGROUND="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf '{"error":"Unknown argument: %s"}\n' "$1"
      exit 1
      ;;
  esac
done

if [[ -z "$DESIGN_DIR" ]]; then
  printf '{"error":"Missing --design-dir"}\n'
  exit 1
fi

mkdir -p "$DESIGN_DIR"
DESIGN_DIR="$(cd "$DESIGN_DIR" && pwd)"

STATE_DIR="$DESIGN_DIR/.preview"
PID_FILE="$STATE_DIR/server.pid"
PREVIEW_FILE="$STATE_DIR/preview.json"
LOG_FILE="$STATE_DIR/server.log"
mkdir -p "$STATE_DIR"

is_alive() {
  local target_pid="$1"
  if [[ -z "$target_pid" ]] || ! kill -0 "$target_pid" 2>/dev/null; then
    return 1
  fi
  if [[ -r "/proc/$target_pid/status" ]]; then
    if grep -q '^State:[[:space:]]*Z' "/proc/$target_pid/status" 2>/dev/null; then
      return 1
    fi
  fi
  return 0
}

# Reuse a healthy server that is already serving this workspace.
if [[ -f "$PID_FILE" ]]; then
  existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if is_alive "$existing_pid"; then
    if [[ -f "$PREVIEW_FILE" ]]; then
      cat "$PREVIEW_FILE"
      exit 0
    fi
  fi
  rm -f "$PID_FILE" "$PREVIEW_FILE"
fi

if [[ "$FOREGROUND" == "true" ]]; then
  exec node "$SCRIPT_DIR/preview-server.mjs" \
    --design-dir "$DESIGN_DIR" \
    --port "$PORT" \
    --host "$HOST"
fi

nohup node "$SCRIPT_DIR/preview-server.mjs" \
  --design-dir "$DESIGN_DIR" \
  --port "$PORT" \
  --host "$HOST" \
  >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null || true
printf '%s\n' "$SERVER_PID" >"$PID_FILE"

for _ in $(seq 1 100); do
  if [[ -f "$PREVIEW_FILE" ]]; then
    cat "$PREVIEW_FILE"
    exit 0
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    printf '{"error":"Server exited during startup","log":"%s"}\n' "$LOG_FILE"
    exit 1
  fi
  sleep 0.05
done

printf '{"error":"Server did not start within 5 seconds","log":"%s"}\n' "$LOG_FILE"
exit 1
