use lambda_http::{Body, Response};

use crate::contracts::VersionResponse;
use crate::response::json_response;

/// Placeholder version values. In production these would come from
/// build-time environment variables or a config source.
pub fn handle_version() -> Response<Body> {
    let body = VersionResponse {
        version: env!("CARGO_PKG_VERSION").to_string(),
        content_version: "0.0.0".to_string(),
    };
    json_response(200, &body)
}
