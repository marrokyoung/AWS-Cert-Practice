use lambda_http::{Body, Response};

use crate::constants::GUEST_SESSION_TTL_SECONDS;
use crate::contracts::ConfigResponse;
use crate::response::json_response;

/// Returns static bootstrap configuration.
/// Content is hardcoded for Sprint 1; a future step may source it
/// from environment variables or a config store.
pub fn handle_config() -> Response<Body> {
    let body = ConfigResponse {
        supported_certs: vec!["CLF-C02".to_string(), "SAA-C03".to_string()],
        default_cert: "CLF-C02".to_string(),
        guest_session_ttl_seconds: GUEST_SESSION_TTL_SECONDS as u64,
    };
    json_response(200, &body)
}
