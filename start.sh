#!/bin/bash
pnpm dev 2>&1 | tee /dev/stderr | while IFS= read -r line; do
  if [[ "$line" =~ Local:[[:space:]]+(http://[^[:space:]]+) ]]; then
    echo ""
    echo "You can access the app at ${BASH_REMATCH[1]}"
  fi
done
