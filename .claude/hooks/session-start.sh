#!/usr/bin/env bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [ -z "$PROJECT_DIR" ]; then
  echo "session-start: could not resolve project directory" >&2
  exit 2
fi
cd "$PROJECT_DIR" || { echo "session-start: could not cd to $PROJECT_DIR" >&2; exit 2; }

pnpm install
