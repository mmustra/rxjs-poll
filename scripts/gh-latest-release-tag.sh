#!/bin/bash
VERSION=$1

if ! ACTUAL_LATEST=$(gh release list --limit 30 --exclude-pre-releases --json tagName | jq -r '.[].tagName' | sort -V | tail -1); then
  echo "Failed to fetch releases"
  exit 1
fi

if [ -n "$ACTUAL_LATEST" ] && [ "$ACTUAL_LATEST" != "$VERSION" ]; then
  echo "Setting $ACTUAL_LATEST as latest release"
  gh release edit $ACTUAL_LATEST --latest=true
else
  echo "No action needed - either no releases found or $VERSION is already the highest"
fi
