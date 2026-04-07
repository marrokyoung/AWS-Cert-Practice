output "api_base_url" {
  description = "Base URL for the API Gateway HTTP API."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name for the frontend."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend static assets."
  value       = aws_s3_bucket.frontend.id
}

output "guest_sessions_table_name" {
  description = "DynamoDB table name for guest sessions."
  value       = aws_dynamodb_table.guest_sessions.name
}

output "lambda_function_name" {
  description = "Lambda function name for the API."
  value       = aws_lambda_function.api.function_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used for cache invalidation)."
  value       = aws_cloudfront_distribution.frontend.id
}

output "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications."
  value       = aws_sns_topic.alarms.arn
}
