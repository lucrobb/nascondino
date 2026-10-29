//For now we will maintain JSON for simplicity, observability and because it is already in use on the frontend
use http_body_util::Full;
use hyper::body::Bytes;
use hyper::{Response, StatusCode};
use hyper::header::{
    HeaderValue,
    ACCESS_CONTROL_ALLOW_HEADERS,
    ACCESS_CONTROL_ALLOW_METHODS,
    ACCESS_CONTROL_ALLOW_ORIGIN
};

use crate::types::{ClientMessage, ServerMessage, HttpResponse};

pub fn decode(data: &[u8]) -> Result<ClientMessage, String> {
    match serde_json::from_slice::<ClientMessage>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}

pub fn encode(data: &ServerMessage) -> Result<String, String> {
    match serde_json::to_string::<ServerMessage>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}

pub fn add_cors_headers(response: &mut HttpResponse) {
    let headers = response.headers_mut();

    headers.insert(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("http://localhost:5173"),
    );

    headers.insert(
        ACCESS_CONTROL_ALLOW_METHODS,
        HeaderValue::from_static("GET, POST, OPTIONS"),
    );

    headers.insert(
        ACCESS_CONTROL_ALLOW_HEADERS,
        HeaderValue::from_static("Content-Type"),
    );
}

pub fn http_response(data: ServerMessage) -> HttpResponse {
    let body = match encode(&data) {
        Ok(body) => body,
        Err(e) => {
            eprintln!("Error serializing body: {e}");
            return error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Errore provando a mandare il messaggio",
            );
        }
    };

    let mut http_body = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap();
    add_cors_headers(&mut http_body);

    return http_body;
}

pub fn error_response(
    status: StatusCode,
    message: &str,
) -> HttpResponse {
    let body = match encode(
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

    let mut http_body = Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap();
    add_cors_headers(&mut http_body);

    return http_body;
}
