#!/bin/sh
# Turns the packaged TrueType faces into web fonts. Run it after changing
# packages/dart/fonts; the result is committed, so a normal build needs no
# Python. Requires: pip install fonttools brotli
set -eu
cd "$(dirname "$0")/.."
mkdir -p packages/npm/fonts
for f in packages/dart/fonts/*.ttf; do
  name=$(basename "$f" .ttf)
  fonttools ttLib.woff2 compress -o "packages/npm/fonts/$name.woff2" "$f"
done
ls -l packages/npm/fonts
