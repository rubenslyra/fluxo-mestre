#!/bin/sh
set -eu

bun /app/docker/server.mjs &
app_pid="$!"

nginx -g "daemon off;" &
nginx_pid="$!"

term() {
  kill "$app_pid" "$nginx_pid" 2>/dev/null || true
}

trap term INT TERM

while true; do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    wait "$app_pid"
    exit "$?"
  fi

  if ! kill -0 "$nginx_pid" 2>/dev/null; then
    wait "$nginx_pid"
    exit "$?"
  fi

  sleep 1
done
