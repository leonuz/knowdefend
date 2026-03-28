#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local-services"
LOG_DIR="$STATE_DIR/logs"

API_PORT="${API_PORT:-7172}"
DEV_PORT="${DEV_PORT:-443}"
DEV_HOST="${DEV_HOST:-sniperhack.uzc}"

API_PID_FILE="$STATE_DIR/api.pid"
HTTPS_PID_FILE="$STATE_DIR/https.pid"
API_LOG="$LOG_DIR/api.log"
HTTPS_LOG="$LOG_DIR/https.log"

mkdir -p "$LOG_DIR"

is_running() {
    local pid_file="$1"

    [[ -f "$pid_file" ]] || return 1

    local pid
    pid="$(cat "$pid_file")"
    [[ -n "$pid" ]] || return 1

    kill -0 "$pid" 2>/dev/null
}

require_privileged_port_access() {
    if [[ "$DEV_PORT" -lt 1024 ]] && [[ "$(id -u)" -ne 0 ]]; then
        echo "Port $DEV_PORT requires elevated privileges."
        echo "Run with sudo, or set DEV_PORT to a port >= 1024."
        exit 1
    fi
}

start_api() {
    if is_running "$API_PID_FILE"; then
        echo "API already running with PID $(cat "$API_PID_FILE")."
        return
    fi

    echo "Starting Azure Functions API on port $API_PORT..."
    (
        cd "$ROOT_DIR/api"
        nohup npx func start --port "$API_PORT" >"$API_LOG" 2>&1 &
        echo $! >"$API_PID_FILE"
    )
    echo "API PID $(cat "$API_PID_FILE")"
}

start_https() {
    if is_running "$HTTPS_PID_FILE"; then
        echo "HTTPS server already running with PID $(cat "$HTTPS_PID_FILE")."
        return
    fi

    require_privileged_port_access

    echo "Starting HTTPS frontend on https://$DEV_HOST${DEV_PORT:-443}..."
    (
        cd "$ROOT_DIR"
        nohup env DEV_HOST="$DEV_HOST" DEV_PORT="$DEV_PORT" API_PORT="$API_PORT" \
            node "$ROOT_DIR/scripts/dev-https-server.js" >"$HTTPS_LOG" 2>&1 &
        echo $! >"$HTTPS_PID_FILE"
    )
    echo "HTTPS PID $(cat "$HTTPS_PID_FILE")"
}

start_api
sleep 2
start_https

echo
echo "Logs:"
echo "  API:   $API_LOG"
echo "  HTTPS: $HTTPS_LOG"
echo
echo "Use ./scripts/status-local-services.sh to inspect status."
