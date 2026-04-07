# Infrastructure — Terraform

Single-root Terraform configuration for the AWS Cert Practice platform.

## What This Stack Creates

- **Frontend hosting**: Private S3 bucket + CloudFront distribution with OAC (HTTPS only)
- **Backend API**: API Gateway HTTP API with routes for `GET /health`, `GET /version`, `GET /config`, `POST /guest-sessions`
- **Compute**: Lambda function (Rust custom runtime on `provided.al2023`)
- **Data**: DynamoDB `guest-sessions` table (on-demand billing, TTL enabled)
- **Security**: Lambda reserved concurrency, API Gateway throttling (rate + burst)
- **Observability**: CloudWatch alarms (Lambda errors, throttles, API 5XX/4XX), Lambda log group with retention
- **Cost controls**: AWS Budget with email notifications at 80% and 100% thresholds

## What This Stack Intentionally Does Not Create

- Cognito user pools or identity providers
- Route53 hosted zones or DNS records
- ACM certificates or custom domains
- Review or progress DynamoDB tables
- VPC, subnets, or NAT gateways
- Build or deploy automation (no `cargo build`, no S3 uploads)
- WAF (HTTP API does not support WAF; throttling provides rate-based protection)

## Required Variables

| Variable | Description | Default |
|---|---|---|
| `lambda_package_path` | Path to pre-built Lambda zip | *(required)* |
| `lambda_source_code_hash` | Base64 SHA256 of the zip | *(required)* |
| `budget_notification_email` | Email for budget alerts | *(required)* |
| `aws_region` | AWS region | `us-east-1` |
| `environment` | Environment name | `dev` |
| `project_name` | Project name for naming | `awscertpractice` |
| `allowed_cors_origins` | API CORS origins (see note below) | `["http://localhost:3000"]` |
| `alarm_notification_email` | Email for CloudWatch alarms | Falls back to `budget_notification_email` |
| `lambda_reserved_concurrency` | Max concurrent Lambda executions | `10` |
| `api_throttle_rate_limit` | API sustained request rate/sec | `10` |
| `api_throttle_burst_limit` | API burst capacity | `20` |
| `log_retention_days` | CloudWatch log retention | `14` |
| `monthly_budget_amount` | Monthly budget threshold (USD) | `10` |

**CORS**: The default `allowed_cors_origins` only permits `http://localhost:3000` for local development. For deployed environments, you **must** override this to include the CloudFront domain (e.g. `["https://d1234abcd.cloudfront.net"]`), otherwise browser API calls from the frontend will fail CORS.

## Lambda Artifacts

Terraform does **not** build the Rust binary. Supply a pre-built zip via `lambda_package_path` and its hash via `lambda_source_code_hash`. A packaging or CI workflow will handle the build step separately.

For local validation (without a real artifact), you can create a dummy zip:

```bash
echo "placeholder" > bootstrap && zip lambda.zip bootstrap && rm bootstrap
```

Then pass:
```
lambda_package_path     = "lambda.zip"
lambda_source_code_hash = "<base64 sha256 of lambda.zip>"
```

## Usage

```bash
# Format check
terraform fmt -check -recursive

# Initialize (local validation, no backend)
terraform init -backend=false

# Validate
terraform validate

# Plan (requires AWS credentials and variable values)
terraform plan -var-file=dev.tfvars
```
