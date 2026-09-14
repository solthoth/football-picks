#!/usr/bin/env bash
# Claude Code PreToolUse hook for Bash.
# Rejects `git commit ... --no-verify` (or short `-n`) so the local
# pre-commit hooks (commitlint + eslint + tsc) cannot be bypassed.
# Exit 2 = block tool call and surface stderr to the model.

set -eu

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"

# Only inspect git commit invocations.
if ! printf '%s' "$cmd" | grep -qE '(^|[[:space:];&|])git[[:space:]]+commit\b'; then
  exit 0
fi

# Match --no-verify, or short flag groups containing `n` (e.g. -n, -nm, -am -n).
if printf '%s' "$cmd" | grep -qE -- '--no-verify\b|(^|[[:space:]])-[A-Za-z]*n[A-Za-z]*([[:space:]]|$)'; then
  cat >&2 <<'MSG'
Blocked: `git commit --no-verify` (or `-n`) is not allowed in this repo.
The pre-commit hooks (commitlint, eslint, tsc) are there to catch real problems.
Fix the underlying hook failure and commit again instead of skipping verification.
MSG
  exit 2
fi

exit 0
