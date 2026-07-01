#!/usr/bin/env bash
set -uo pipefail

INPUT="$(cat)"
STOP_HOOK_ACTIVE="$(echo "$INPUT" | jq -r '.stop_hook_active // false')"

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [ -z "$PROJECT_DIR" ]; then
  echo "run-e2e-tests: could not resolve project directory" >&2
  exit 2
fi
cd "$PROJECT_DIR" || { echo "run-e2e-tests: could not cd to $PROJECT_DIR" >&2; exit 2; }

OUTPUT="$(pnpm test:e2e 2>&1)"
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo "e2e tests failed (pnpm test:e2e exited $STATUS):" >&2
  echo "$OUTPUT" >&2
  exit 2
fi

exit 0
