#!/usr/bin/env bash
# Refresh the vendored shared packages from the monorepo folder (../packages).
# Run after changing any @live-show/* package so the standalone deploy matches.
# live-show-ads only consumes @live-show/design-system.
set -euo pipefail
cd "$(dirname "$0")/.."
for p in design-system; do
  rsync -a --delete --exclude node_modules --exclude 'dist' --exclude '*.tsbuildinfo' \
    "../packages/$p/" "shared/$p/"
done
echo "synced shared/ from ../packages"
