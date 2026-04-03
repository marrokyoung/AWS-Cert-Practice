//! Rust mirrors of the TypeScript contracts in src/contracts/api.ts.
//! Field names must stay identical to the TypeScript definitions.

use serde::{Deserialize, Serialize};

/// GET /health
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthResponse {
    pub status: HealthStatus,
    pub timestamp: String,
}

/// Sprint 1 only returns `Ok`; `Degraded` is part of the public contract.
#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)]
pub enum HealthStatus {
    Ok,
    Degraded,
}

/// GET /version
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionResponse {
    pub version: String,
    pub content_version: String,
}

/// GET /config
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigResponse {
    pub supported_certs: Vec<String>,
    pub default_cert: String,
    pub guest_session_ttl_seconds: u64,
}

/// POST /guest-sessions -- request body
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GuestSessionBootstrapRequest {
    pub client_id: Option<String>,
}

/// POST /guest-sessions -- response body
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GuestSessionBootstrapResponse {
    pub session_id: String,
    pub expires_at: String,
}

/// Standard API error envelope
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Map<String, serde_json::Value>>,
}

impl ApiError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self {
            code: "BAD_REQUEST".to_string(),
            message: message.into(),
            details: None,
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            code: "NOT_FOUND".to_string(),
            message: message.into(),
            details: None,
        }
    }
}
