variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used in resource naming and tags."
  type        = string
  default     = "awscertpractice"
}

variable "frontend_bucket_name_override" {
  description = "Override the auto-generated frontend S3 bucket name. Leave empty to use the default convention."
  type        = string
  default     = ""
}

variable "allowed_cors_origins" {
  description = "Origins allowed for CORS on the API Gateway."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "lambda_package_path" {
  description = "Path to the pre-built Lambda deployment package (zip)."
  type        = string
}

variable "lambda_source_code_hash" {
  description = "Base64-encoded SHA256 hash of the Lambda deployment package, used to trigger updates."
  type        = string
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for the Lambda function. Acts as a hard cost ceiling."
  type        = number
  default     = 10
}

variable "api_throttle_rate_limit" {
  description = "API Gateway default route throttling: sustained request rate (requests/second)."
  type        = number
  default     = 10
}

variable "api_throttle_burst_limit" {
  description = "API Gateway default route throttling: burst capacity."
  type        = number
  default     = 20
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days."
  type        = number
  default     = 14
}

variable "monthly_budget_amount" {
  description = "Monthly AWS budget threshold in USD."
  type        = string
  default     = "10"
}

variable "budget_notification_email" {
  description = "Email address for budget alarm notifications."
  type        = string
}

variable "alarm_notification_email" {
  description = "Email address for CloudWatch alarm notifications. Uses budget_notification_email if not set."
  type        = string
  default     = ""
}
