# -----------------------------------------------------------------------------
# Security controls
# -----------------------------------------------------------------------------
#
# Lambda reserved concurrency is set directly on the aws_lambda_function
# resource in backend.tf via var.lambda_reserved_concurrency. This acts as a
# hard ceiling on concurrent executions to limit both cost and blast radius.
#
# WAF is not used in Sprint 1. The API Gateway HTTP API does not natively
# support WAF association (WAF requires REST API or ALB). Instead, rate-based
# protection is provided by:
#
#   1. API Gateway default stage throttling (rate + burst limits)
#   2. Lambda reserved concurrency
#
# These two controls together cap throughput and cost. WAF can be introduced
# later if the API is migrated to REST API or fronted by an ALB.
# -----------------------------------------------------------------------------
