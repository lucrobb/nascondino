use std::convert::Infallible;

use http_body_util::Full;
use hyper::body::{Bytes, Incoming};
use hyper::{Response, Method, Request, StatusCode};

use crate::types::{RegistryHandle, HttpResponse};
use crate::routing::websocket::handle_websocket_upgrade;
use crate::routing::http::{get_lobby, create_lobby};
use crate::protocol::{error_response, add_cors_headers};


pub async fn handle_request(
    request: Request<Incoming>,
    registry_handle: RegistryHandle
) -> Result<HttpResponse, Infallible> {
    let method = request.method().clone();
    if method == Method::OPTIONS {
        let mut response = Response::builder()
            .status(StatusCode::NO_CONTENT)
            .body(Full::new(Bytes::new()))
            .unwrap();

        add_cors_headers(&mut response);

        return Ok(response);
    }

    let path = request.uri().path().to_string();
    let segments: Vec<&str> = path.as_str().split('/').filter(|s| !s.is_empty()).collect();
    if segments.is_empty() {
        return Ok(error_response(
            StatusCode::BAD_REQUEST,
            "URL incompleto"
        ));
    }

    //If there is a request to upgrade to websocket
    if hyper_tungstenite::is_upgrade_request(&request) {
        return Ok(handle_websocket_upgrade(request, &segments, registry_handle).await);
    }

    //Handle HTTP requests and hand them off to the dedicated endpoints
    // Expected api/... for segments, so at least 2 segments and then eventual parameters like room code
    if segments.len() < 2 || segments[0] != "api" {
        return Ok(error_response(
            StatusCode::BAD_REQUEST,
            "URL incompleto"
        ));
    }

    match (method, segments[1]) {
        (Method::GET, "lobby") => {
            if segments.len() != 3 {
                return Ok(error_response(
                    StatusCode::BAD_REQUEST,
                    "URL invalido"
                ));
            }
            let room_code = segments[2];
            return Ok(get_lobby(room_code, registry_handle).await);
        },
        (Method::POST, "lobby") => {
            return Ok(create_lobby(registry_handle).await);
        },
        _ => {
            return Ok(error_response(
                StatusCode::NOT_FOUND,
                "Richiesta invalida",
            ));
        }
    }
}
