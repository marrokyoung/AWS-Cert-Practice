# -----------------------------------------------------------------------------
# Backend: DynamoDB, Lambda, API Gateway
# -----------------------------------------------------------------------------

# --- DynamoDB: guest-sessions table ---

resource "aws_dynamodb_table" "guest_sessions" {
  name         = local.guest_sessions_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# --- Lambda execution role ---

resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

# Basic execution: CloudWatch Logs only.
# DynamoDB permissions will be added when the handler actually writes to the table.
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Lambda log group (explicit, with retention) ---

resource "aws_cloudwatch_log_group" "lambda" {
  name              = local.lambda_log_group
  retention_in_days = var.log_retention_days
}

# --- Lambda function ---

resource "aws_lambda_function" "api" {
  function_name    = local.lambda_function_name
  role             = aws_iam_role.lambda.arn
  handler          = "bootstrap"
  runtime          = "provided.al2023"
  filename         = var.lambda_package_path
  source_code_hash = var.lambda_source_code_hash
  timeout          = 10
  memory_size      = 128

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      TABLE_ENV            = var.environment
      GUEST_SESSIONS_TABLE = local.guest_sessions_table
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]
}

# --- API Gateway HTTP API ---

resource "aws_apigatewayv2_api" "api" {
  name          = local.api_gateway_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_cors_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }
}

# Lambda integration

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# Routes

resource "aws_apigatewayv2_route" "get_health" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_version" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /version"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_config" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /config"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_guest_sessions" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /guest-sessions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Default stage with auto-deploy and throttling

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = var.api_throttle_rate_limit
    throttling_burst_limit = var.api_throttle_burst_limit
  }
}

# Allow API Gateway to invoke Lambda

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
