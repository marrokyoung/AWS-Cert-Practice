use lambda_http::{Body, Response};

use crate::contracts::{HealthResponse, HealthStatus};
use crate::response::json_response;

pub fn handle_health() -> Response<Body> {
    let body = HealthResponse {
        status: HealthStatus::Ok,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    json_response(200, &body)
}
