#!/usr/bin/env bash
set -euo pipefail

# Build the Next.js static export and deploy to S3 + CloudFront.
# Requires: AWS CLI configured, Terraform applied.
#
# Usage: ./scripts/deploy-frontend.sh

cd "$(git rev-parse --show-toplevel)"

TF_DIR="infra/terraform"

BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket_name)
DIST_ID=$(terraform -chdir="$TF_DIR" output -raw cloudfront_distribution_id)

echo "Building frontend..."
pnpm build

echo "Uploading to s3://$BUCKET..."
aws s3 sync out/ "s3://$BUCKET" --delete

echo "Invalidating CloudFront cache ($DIST_ID)..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" > /dev/null

echo ""
DOMAIN=$(terraform -chdir="$TF_DIR" output -raw cloudfront_domain_name)
echo "Deploy complete: https://$DOMAIN"
