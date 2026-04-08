#!/usr/bin/env bash
set -euo pipefail

# Build the Rust Lambda function for arm64 and package as a zip.
# Run this from inside WSL.
#
# Requires (inside WSL): rustup, cargo-lambda, ziglang (pip3)
#
# Output: backend/rust-api/target/lambda/rust-api/bootstrap.zip

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../backend/rust-api"

echo "Building Lambda function (arm64)..."
cargo lambda build --release --arm64 --output-format zip

ZIP="target/lambda/rust-api/bootstrap.zip"

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: Expected output not found at $ZIP"
  exit 1
fi

echo ""
echo "Build complete: backend/rust-api/$ZIP"
