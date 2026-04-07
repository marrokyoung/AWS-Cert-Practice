# Shared naming convention.
# Table names follow backend/rust-api/TABLES.md: {env}-awscertpractice-{domain}
locals {
  name_prefix = "${var.environment}-${var.project_name}"

  frontend_bucket_name  = var.frontend_bucket_name_override != "" ? var.frontend_bucket_name_override : "${local.name_prefix}-frontend"
  guest_sessions_table  = "${local.name_prefix}-guest-sessions"
  lambda_function_name  = "${local.name_prefix}-api"
  api_gateway_name      = "${local.name_prefix}-api"
  cloudfront_comment    = "${var.project_name} ${var.environment} frontend"
  lambda_log_group      = "/aws/lambda/${local.lambda_function_name}"
  cloudfront_log_prefix = "cloudfront/"
  alarm_namespace       = local.name_prefix
  alarm_email           = var.alarm_notification_email != "" ? var.alarm_notification_email : var.budget_notification_email
  alarm_actions         = [aws_sns_topic.alarms.arn]
}
