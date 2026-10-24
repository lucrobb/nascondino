use std::convert::Infallible;

use http_body_util::BodyExt;
use hyper::body::{Bytes, Incoming};
use hyper::{Method, Request, Response, StatusCode};

use crate::types::RegistryHandle;

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

    match (method, path.as_str()) {
        (Method::GET, "/lobby") => {
            let collected = match request.into_body().collect().await {
                Ok(collected) => collected,
                Err(_) => {
                    return Ok(error_response(
                        StatusCode::BAD_REQUEST, 
                        "Impossibile leggere la richiesta",
                    ));
                }
            };
            let bytes = collected.to_bytes();
            let request_body: ClientMessage::FindLobby = match decode(&bytes) {
                Ok(body) => body,
                Err(e) => {
                    eprintln!("Error parsing request body: {e}");
                    return Ok(error_response(
                        StatusCode::BAD_REQUEST,
                        "Impossibile leggere la richiesta",
                    ));
                }
            };

            return Ok(get_lobby(&request_body.room_code, registry_handle).await);
        },
        (Method::POST, "/lobby", None) => {
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

