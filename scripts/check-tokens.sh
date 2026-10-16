#!/usr/bin/env bash
# Fails when src/styles.css contains raw hex, var(--x, #hex) fallbacks,
# or font-family names that aren't loaded by the app.
# Colors and fonts must come from tokens (src/styles/tokens.css).
set -u
fail=0
file="src/styles.css"

# Strip /* ... */ block comments before scanning so the doctrine banner
# at the top of the file (which intentionally mentions these patterns)
# doesn't trip the check.
stripped=$(python3 -c "
import re, sys
s = open('$file').read()
print(re.sub(r'/\*.*?\*/', lambda m: '\n'*m.group(0).count('\n'), s, flags=re.S))
")

if printf '%s\n' "$stripped" | grep -nE 'var\(--[a-z0-9-]+,\s*#'; then
  echo "✗ var(--x, #hex) fallback found in $file"
  fail=1
fi

if printf '%s\n' "$stripped" | grep -nE '#[0-9a-fA-F]{6}\b'; then
  echo "✗ raw hex color found in $file — use a token from src/styles/tokens.css"
  fail=1
fi

if printf '%s\n' "$stripped" | grep -nE '"(DM Sans|Sora|Roboto|Helvetica|Arial)"'; then
  echo "✗ unloaded font-family found in $file — use var(--font-ui|--font-ed|--font-mono)"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "✓ tokens check passed"
fi
exit "$fail"
