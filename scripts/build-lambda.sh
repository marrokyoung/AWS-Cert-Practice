#!/usr/bin/env bash
set -euo pipefail

# Build the Rust Lambda function for arm64 Linux and package as a zip.
# Requires: cargo-lambda (install with: cargo install cargo-lambda)
#
# Output: backend/rust-api/target/lambda/rust-api/bootstrap.zip

cd "$(git rev-parse --show-toplevel)/backend/rust-api"

echo "Building Lambda function (arm64)..."
cargo lambda build --release --arm64 --output-format zip

ZIP="target/lambda/rust-api/bootstrap.zip"

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: Expected output not found at $ZIP"
  exit 1
fi

echo ""
echo "Build complete: backend/rust-api/$ZIP"
echo "Hash: $(openssl dgst -sha256 -binary "$ZIP" | openssl base64)"
