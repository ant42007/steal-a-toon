#!/usr/bin/env bash
# One-command build: script JSON -> voiceover + captions timeline + mix -> 3D render -> MP4
#   bash build.sh v2            (CRACKS: scripts/script.v2.json -> ../renders/cracks-v2.mp4)
#   bash build.sh numbers-v1    (THE NUMBERS: scripts/numbers-v1.json -> ../renders/numbers-v1.mp4)
set -euo pipefail
cd "$(dirname "$0")"
V="${1:?usage: build.sh <version>}"
S="scripts/$V.json"; [ -f "$S" ] || S="scripts/script.$V.json"

M=.cache/models
if [ ! -f "$M/kokoro-v1.0.onnx" ]; then
  mkdir -p "$M"
  base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
  curl -sSL -o "$M/kokoro-v1.0.onnx" "$base/kokoro-v1.0.onnx"
  curl -sSL -o "$M/voices-v1.0.bin" "$base/voices-v1.0.bin"
fi
[ -d node_modules/three ] || npm install --no-audit --no-fund

python3 tools/build_audio.py "$S" "build/$V"
node render.mjs "$V" --workers "${WORKERS:-3}"
