#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local-services"

API_PID_FILE="$STATE_DIR/api.pid"
HTTPS_PID_FILE="$STATE_DIR/https.pid"

print_status() {
    local label="$1"
    local pid_file="$2"

    if [[ ! -f "$pid_file" ]]; then
        echo "$label: stopped"
        return
    fi

    local pid
    pid="$(cat "$pid_file")"

    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        echo "$label: running (PID $pid)"
    else
        echo "$label: stale PID file ($pid)"
    fi
}

print_status "Azure Functions API" "$API_PID_FILE"
print_status "HTTPS server" "$HTTPS_PID_FILE"
