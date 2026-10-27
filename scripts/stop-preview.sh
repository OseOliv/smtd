#!/usr/bin/env bash
# Stop the show-me-the-design preview server for a workspace.
#
# Usage: stop-preview.sh <design-dir>
#
# Keeps the design files; removes only runtime state.

set -euo pipefail

DESIGN_DIR="${1:-}"

if [[ -z "$DESIGN_DIR" ]]; then
  printf '{"error":"Usage: stop-preview.sh <design-dir>"}\n'
  exit 1
fi

mkdir -p "$DESIGN_DIR"
DESIGN_DIR="$(cd "$DESIGN_DIR" && pwd)"

STATE_DIR="$DESIGN_DIR/.preview"
PID_FILE="$STATE_DIR/server.pid"
PREVIEW_FILE="$STATE_DIR/preview.json"
LOG_FILE="$STATE_DIR/server.log"

if [[ ! -f "$PID_FILE" ]]; then
  rm -f "$PREVIEW_FILE"
  printf '{"status":"not_running"}\n'
  exit 0
fi

pid="$(cat "$PID_FILE" 2>/dev/null || true)"

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

if is_alive "$pid"; then
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    if ! is_alive "$pid"; then
      break
    fi
    sleep 0.1
  done
  if is_alive "$pid"; then
    kill -9 "$pid" 2>/dev/null || true
    sleep 0.1
  fi
  if is_alive "$pid"; then
    printf '{"status":"failed","error":"process still running"}\n'
    exit 1
  fi
fi

rm -f "$PID_FILE" "$PREVIEW_FILE" "$LOG_FILE"
printf '{"status":"stopped"}\n'
