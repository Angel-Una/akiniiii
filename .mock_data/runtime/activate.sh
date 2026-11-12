#!/usr/bin/env bash
set -euo pipefail
RUNTIME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export REBUILD_RUNTIME_DIR="$RUNTIME_DIR"
if [ "${1:-}" != "--allow-unready" ] && [ ! -f "$RUNTIME_DIR/READY" ]; then
  echo "runtime is not ready: $RUNTIME_DIR" >&2
  return 1 2>/dev/null || exit 1
fi
set -a
[ ! -f "$RUNTIME_DIR/runtime.env" ] || . "$RUNTIME_DIR/runtime.env"
set +a
