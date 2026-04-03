use lambda_http::http;
use lambda_http::{Body, Response};
use serde_json::Value;

use super::handler;

fn get_request(path: &str) -> lambda_http::Request {
    http::Request::builder()
        .method("GET")
        .uri(path)
        .body(Body::Empty)
        .unwrap()
}

fn post_request(path: &str, body: &str) -> lambda_http::Request {
    http::Request::builder()
        .method("POST")
        .uri(path)
        .header("content-type", "application/json")
        .body(Body::Text(body.to_string()))
        .unwrap()
}

fn parse_body(response: &Response<Body>) -> Value {
    match response.body() {
        Body::Text(text) => serde_json::from_str(text).expect("response is not valid JSON"),
        _ => panic!("expected text body"),
    }
}

// -- Route smoke tests --

#[tokio::test]
async fn health_returns_200_with_ok_status() {
    let resp = handler(get_request("/health")).await.unwrap();
    assert_eq!(resp.status(), 200);
    let body = parse_body(&resp);
    assert_eq!(body["status"], "ok");
    assert!(body["timestamp"].is_string());
}

#[tokio::test]
async fn version_returns_200() {
    let resp = handler(get_request("/version")).await.unwrap();
    assert_eq!(resp.status(), 200);
    let body = parse_body(&resp);
    assert!(body["version"].is_string());
    assert!(body["contentVersion"].is_string());
}

#[tokio::test]
async fn config_returns_200_with_supported_certs() {
    let resp = handler(get_request("/config")).await.unwrap();
    assert_eq!(resp.status(), 200);
    let body = parse_body(&resp);
    assert!(body["supportedCerts"].is_array());
    assert!(body["defaultCert"].is_string());
    assert!(body["guestSessionTtlSeconds"].is_number());
}

#[tokio::test]
async fn guest_session_returns_201_with_session_id() {
    let resp = handler(post_request("/guest-sessions", "{}"))
        .await
        .unwrap();
    assert_eq!(resp.status(), 201);
    let body = parse_body(&resp);
    assert!(body["sessionId"].is_string());
    assert!(body["expiresAt"].is_string());
}

// -- Serialization tests for success payloads --

#[tokio::test]
async fn health_response_fields_match_contract() {
    let resp = handler(get_request("/health")).await.unwrap();
    let body = parse_body(&resp);
    let obj = body.as_object().unwrap();
    assert!(obj.contains_key("status"));
    assert!(obj.contains_key("timestamp"));
    assert_eq!(obj.len(), 2);
}

#[tokio::test]
async fn version_response_fields_match_contract() {
    let resp = handler(get_request("/version")).await.unwrap();
    let body = parse_body(&resp);
    let obj = body.as_object().unwrap();
    assert!(obj.contains_key("version"));
    assert!(obj.contains_key("contentVersion"));
    assert_eq!(obj.len(), 2);
}

#[tokio::test]
async fn config_response_fields_match_contract() {
    let resp = handler(get_request("/config")).await.unwrap();
    let body = parse_body(&resp);
    let obj = body.as_object().unwrap();
    assert!(obj.contains_key("supportedCerts"));
    assert!(obj.contains_key("defaultCert"));
    assert!(obj.contains_key("guestSessionTtlSeconds"));
    assert_eq!(obj.len(), 3);
}

#[tokio::test]
async fn guest_session_response_fields_match_contract() {
    let resp = handler(post_request("/guest-sessions", "{}"))
        .await
        .unwrap();
    let body = parse_body(&resp);
    let obj = body.as_object().unwrap();
    assert!(obj.contains_key("sessionId"));
    assert!(obj.contains_key("expiresAt"));
    assert_eq!(obj.len(), 2);
}

// -- Request validation tests for POST /guest-sessions --

#[tokio::test]
async fn guest_session_accepts_optional_client_id() {
    let resp = handler(post_request("/guest-sessions", r#"{"clientId":"abc-123"}"#))
        .await
        .unwrap();
    assert_eq!(resp.status(), 201);
}

#[tokio::test]
async fn guest_session_rejects_invalid_json() {
    let resp = handler(post_request("/guest-sessions", "not json"))
        .await
        .unwrap();
    assert_eq!(resp.status(), 400);
    let body = parse_body(&resp);
    assert_eq!(body["code"], "BAD_REQUEST");
    assert!(body["message"].is_string());
}

#[tokio::test]
async fn guest_session_rejects_unknown_fields() {
    let resp = handler(post_request(
        "/guest-sessions",
        r#"{"clientId":"abc","extraField":"nope"}"#,
    ))
    .await
    .unwrap();
    assert_eq!(resp.status(), 400);
    let body = parse_body(&resp);
    assert_eq!(body["code"], "BAD_REQUEST");
}

// -- Error response tests --

#[tokio::test]
async fn unknown_route_returns_404() {
    let resp = handler(get_request("/nonexistent")).await.unwrap();
    assert_eq!(resp.status(), 404);
    let body = parse_body(&resp);
    assert_eq!(body["code"], "NOT_FOUND");
    assert!(body["message"].is_string());
}

#[tokio::test]
async fn error_envelope_has_correct_shape() {
    let resp = handler(get_request("/nonexistent")).await.unwrap();
    let body = parse_body(&resp);
    let obj = body.as_object().unwrap();
    assert!(obj.contains_key("code"));
    assert!(obj.contains_key("message"));
}

#[tokio::test]
async fn all_responses_have_json_content_type() {
    let paths = vec![
        get_request("/health"),
        get_request("/version"),
        get_request("/config"),
        get_request("/nonexistent"),
    ];
    for req in paths {
        let resp = handler(req).await.unwrap();
        let ct = resp
            .headers()
            .get("content-type")
            .unwrap()
            .to_str()
            .unwrap();
        assert_eq!(ct, "application/json");
    }
}
