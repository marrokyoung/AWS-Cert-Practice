use lambda_http::{Body, Response};
use serde::Serialize;

use crate::contracts::ApiError;

/// Centralizes JSON response formatting so all routes keep the same
/// serialization and `content-type` behavior.
pub fn json_response<T: Serialize>(status: u16, body: &T) -> Response<Body> {
    let json = serde_json::to_string(body).expect("failed to serialize response");
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(Body::Text(json))
        .expect("failed to build response")
}

pub fn error_response(status: u16, error: ApiError) -> Response<Body> {
    json_response(status, &error)
}
