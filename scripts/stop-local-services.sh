#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local-services"

API_PID_FILE="$STATE_DIR/api.pid"
HTTPS_PID_FILE="$STATE_DIR/https.pid"

stop_service() {
    local label="$1"
    local pid_file="$2"

    if [[ ! -f "$pid_file" ]]; then
        echo "$label is not running."
        return
    fi

    local pid
    pid="$(cat "$pid_file")"

    if [[ -z "$pid" ]]; then
        rm -f "$pid_file"
        echo "$label had an empty PID file. Cleaned up."
        return
    fi

    if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping $label (PID $pid)..."
        kill "$pid"
    else
        echo "$label PID $pid is no longer running. Cleaning up PID file."
    fi

    rm -f "$pid_file"
}

stop_service "HTTPS server" "$HTTPS_PID_FILE"
stop_service "Azure Functions API" "$API_PID_FILE"
