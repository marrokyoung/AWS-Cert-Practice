use lambda_http::{Body, Request, Response};

use crate::constants::GUEST_SESSION_TTL_SECONDS;
use crate::contracts::{ApiError, GuestSessionBootstrapRequest, GuestSessionBootstrapResponse};
use crate::response::{error_response, json_response};

/// Placeholder guest-session bootstrap handler.
///
/// Creates a new guest session with a UUID and expiry timestamp.
/// No persistence yet this is intentionally placeholder-only for Sprint 1.
/// A future step will write the session record to DynamoDB.
pub fn handle_guest_session(request: &Request) -> Response<Body> {
    let body_bytes = request.body().as_ref();

    let GuestSessionBootstrapRequest {
        client_id: _client_id,
    } = match serde_json::from_slice(body_bytes) {
        Ok(parsed) => parsed,
        Err(_) => {
            return error_response(
                400,
                ApiError::bad_request("Invalid or missing JSON request body"),
            );
        }
    };

    let session_id = uuid::Uuid::new_v4().to_string();
    let expires_at =
        (chrono::Utc::now() + chrono::Duration::seconds(GUEST_SESSION_TTL_SECONDS)).to_rfc3339();

    let body = GuestSessionBootstrapResponse {
        session_id,
        expires_at,
    };
    json_response(201, &body)
}
