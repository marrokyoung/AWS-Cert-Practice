mod constants;
mod contracts;
mod response;
mod routes;

use lambda_http::{Body, Error, Request, Response, run, service_fn};

use contracts::ApiError;
use response::error_response;

async fn handler(request: Request) -> Result<Response<Body>, Error> {
    let path = request.uri().path();
    let method = request.method().as_str();

    let response = match (method, path) {
        ("GET", "/health") => routes::health::handle_health(),
        ("GET", "/version") => routes::version::handle_version(),
        ("GET", "/config") => routes::config::handle_config(),
        ("POST", "/guest-sessions") => routes::guest_session::handle_guest_session(&request),
        _ => error_response(404, ApiError::not_found("Route not found")),
    };

    Ok(response)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

#[cfg(test)]
mod tests;
