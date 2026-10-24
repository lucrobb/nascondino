//For now we will maintain JSON for simplicity, observability and because it is already in use on the frontend
use serde::Serialize;
use serde::de::DeserializeOwned;
use http_body_util::Full;
use hyper::body::Bytes;
use hyper::{Response, StatusCode};

use crate::types::ErrorResponse;

pub fn decode<T: DeserializeOwned>(data: &[u8]) -> Result<T, String> {
    match serde_json::from_slice::<T>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}

pub fn encode<T: Serialize>(data: &T) -> Result<String, String> {
    match serde_json::to_string::<T>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}

pub fn http_response<T: Serialize>(data: &T) -> HttpResponse {
    let body = match encode(data) {
        Ok(body) => body,
        Err(e) => {
            eprintln!("Error serializing body: {e}");
            return error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Errore provando a mandare il messaggio",
            );
        }
    };

    return Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap();
}

pub fn error_response(
    status: StatusCode,
    message: &str,
) -> HttpResponse {
    let body = match encode::<ErrorResponse>(
        &ServerMessage::Error { message: message.to_string() }
    ) {
        Ok(body) => body,
        Err(e) => {
            eprintln!("Error serializing error body: {e}");
            return Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(
                    r#"{"type":"error", "message": "Errore del server"}"#,
                )))
                .unwrap();
        }
    };

    return Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap();
}