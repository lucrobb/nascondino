use std::convert::Infallible;

use http_body_util::{BodyExt, Full};
use hyper::body::{Bytes, Incoming};
use hyper::{Method, Request, Response, StatusCode};

use hyper_tungstenite::{HyperWebsocket, tungstenite::Message};

pub async fn handle_request(
    request: Request<Incoming>, 
    registry_handle: RegistryHandle
) -> Result<HttpResponse, Infallible> {
    let method = request.method().clone();
    let path = request.uri().path().to_string();

    //If there is a request to upgrade to websocket
    if hyper_tungstenite::is_upgrade_request(&request) {
        return Ok(handle_websocket_connection(request, &path, registry_handle).await);
    }

    let collected = match request.into_body().collect().await {
        Ok(collected) => collected,
        Err(_) => {
            return Ok(error_response(StatusCode::BAD_REQUEST, "Impossibile leggere la richiesta"));
        }
    };
    let bytes = collected.to_bytes();
    let request_body: Option<RequestBody> = if bytes.is_empty() {
        None
    } else {
        match serde_json::from_slice(&bytes) {
            Ok(body) => Some(body),
            Err(_) => {
                return Ok(error_response(StatusCode::BAD_REQUEST, "Richiesta invalida"));
            }
        }
    };

    return match (method, path.as_str(), request_body) {
        (Method::GET, "/lobby", Some(body)) => {
            Ok(get_lobby(&body.room_code, registry_handle).await)
        },
        (Method::POST, "/lobby", None) => {
            Ok(create_lobby(registry_handle).await)
        },
        _ => {
            return Ok(error_response(StatusCode::NOT_FOUND, "Richiesta invalida"));
        }
    };
}

